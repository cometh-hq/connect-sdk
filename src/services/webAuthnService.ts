import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { parseAuthenticatorData } from '@simplewebauthn/server/helpers'
import CBOR from 'cbor-js'
import { ec as EC } from 'elliptic'
import { ethers } from 'ethers'
import psl from 'psl'
import { v4 } from 'uuid'

import { BLOCK_EVENT_GAP, challengePrefix } from '../constants'
import { P256SignerFactory__factory } from '../contracts/types/factories'
import { API } from '../services'
import * as utils from '../utils/utils'
import { DeviceData, WebAuthnSigner } from '../wallet'
import { ComethProvider } from '../wallet/ComethProvider'
import deviceService from './deviceService'

const _formatCreatingRpId = (): { name: string; id?: string } => {
  return psl.parse(window.location.host).domain
    ? {
        name: psl.parse(window.location.host).domain,
        id: psl.parse(window.location.host).domain
      }
    : { name: 'test' }
}

const _formatSigningRpId = (): string | undefined => {
  return (
    psl.parse(window.location.host).domain &&
    psl.parse(window.location.host).domain
  )
}

const createCredential = async (
  userName?: string
): Promise<{
  point: any
  id: string
}> => {
  const curve = new EC('p256')
  const challenge = new TextEncoder().encode('credentialCreation')

  const webAuthnCredentials: any = await navigator.credentials.create({
    publicKey: {
      rp: _formatCreatingRpId(),
      user: {
        id: new TextEncoder().encode(v4()),
        name: userName ? userName : 'Cometh Connect',
        displayName: userName ? userName : 'Cometh Connect'
      },
      authenticatorSelection: { authenticatorAttachment: 'platform' },
      timeout: 20000,
      challenge,
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }]
    }
  })

  const attestation = CBOR.decode(
    webAuthnCredentials?.response?.attestationObject
  )
  const authData = parseAuthenticatorData(attestation.authData)
  const publicKey = CBOR.decode(authData?.credentialPublicKey?.buffer)
  const x = publicKey[-2]
  const y = publicKey[-3]
  const point = curve.curve.point(x, y)

  return {
    point,
    id: utils.hexArrayStr(webAuthnCredentials.rawId)
  }
}

const createWebAuthnSigner = async (
  API: API,
  userName?: string
): Promise<{
  publicKeyX: string
  publicKeyY: string
  publicKeyId: string
  signerAddress: string
  deviceData: DeviceData
  walletAddress: string
}> => {
  const webAuthnCredentials = await createCredential(userName)

  const publicKeyX = `0x${webAuthnCredentials.point.getX().toString(16)}`
  const publicKeyY = `0x${webAuthnCredentials.point.getY().toString(16)}`
  const publicKeyId = webAuthnCredentials.id
  const signerAddress = await API.predictWebAuthnSignerAddress({
    publicKeyX,
    publicKeyY
  })
  const deviceData = deviceService.getDeviceData()

  const walletAddress = await API.getWalletAddress(signerAddress)

  /* Store WebAuthn credentials in storage */
  _setWebauthnCredentialsInStorage(walletAddress, publicKeyId, signerAddress)

  return {
    publicKeyX,
    publicKeyY,
    publicKeyId,
    signerAddress,
    deviceData,
    walletAddress
  }
}

const sign = async (
  challenge: BufferSource,
  publicKeyCredential: PublicKeyCredentialDescriptor[]
): Promise<any> => {
  const assertionPayload: any = await navigator.credentials.get({
    publicKey: {
      challenge,
      rpId: _formatSigningRpId(),
      allowCredentials: publicKeyCredential,
      timeout: 20000
    }
  })

  return assertionPayload
}

const getWebAuthnSignature = async (
  hash: string,
  publicKeyCredential: PublicKeyCredentialDescriptor[]
): Promise<{ encodedSignature: string; publicKeyId: string }> => {
  const challenge = utils.parseHex(hash.slice(2))
  const assertionPayload = await sign(challenge, publicKeyCredential)
  const publicKeyId = utils.hexArrayStr(assertionPayload.rawId)

  const {
    signature,
    authenticatorData,
    clientDataJSON: clientData
  } = assertionPayload.response

  const rs = utils.derToRS(new Uint8Array(signature))

  const challengeOffset =
    utils.findSequence(
      new Uint8Array(clientData),
      utils.parseHex(challengePrefix)
    ) +
    12 +
    1

  const encodedSignature = ethers.utils.defaultAbiCoder.encode(
    ['bytes', 'bytes', 'uint256', 'uint256[2]'],
    [
      utils.hexArrayStr(authenticatorData),
      utils.hexArrayStr(clientData),
      challengeOffset,
      [utils.hexArrayStr(rs[0]), utils.hexArrayStr(rs[1])]
    ]
  )

  return { encodedSignature, publicKeyId }
}

const waitWebAuthnSignerDeployment = async (
  P256FactoryContractAddress: string,
  publicKey_X: string,
  publicKey_Y: string,
  provider: StaticJsonRpcProvider | ComethProvider
): Promise<string> => {
  const P256FactoryInstance = await P256SignerFactory__factory.connect(
    P256FactoryContractAddress,
    provider
  )

  let signerDeploymentEvent: any = []

  while (signerDeploymentEvent.length === 0) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    signerDeploymentEvent = await P256FactoryInstance.queryFilter(
      P256FactoryInstance.filters.NewSignerCreated(publicKey_X, publicKey_Y),
      BLOCK_EVENT_GAP
    )
  }

  return signerDeploymentEvent[0].args.signer
}

const isWebAuthnCompatible = async (): Promise<boolean> => {
  if (!window.PublicKeyCredential) return false

  const isUserVerifyingPlatformAuthenticatorAvailable =
    await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()

  if (!isUserVerifyingPlatformAuthenticatorAvailable) return false

  return true
}

const signWithWebAuthn = async (
  webAuthnSigners: WebAuthnSigner[],
  challenge: string
): Promise<{
  encodedSignature: string
  publicKeyId: string
}> => {
  const publicKeyCredentials: PublicKeyCredentialDescriptor[] =
    webAuthnSigners.map((webAuthnSigner) => {
      return {
        id: utils.parseHex(webAuthnSigner.publicKeyId),
        type: 'public-key'
      }
    })

  const { encodedSignature, publicKeyId } = await getWebAuthnSignature(
    ethers.utils.keccak256(ethers.utils.hashMessage(challenge)),
    publicKeyCredentials
  )

  return { encodedSignature, publicKeyId }
}

const _setWebauthnCredentialsInStorage = (
  walletAddress: string,
  publicKeyId: string,
  signerAddress: string
): void => {
  const localStorageWebauthnCredentials = JSON.stringify({
    publicKeyId,
    signerAddress
  })
  window.localStorage.setItem(
    `cometh-connect-${walletAddress}`,
    localStorageWebauthnCredentials
  )
}

const _getWebauthnCredentialsInStorage = (
  walletAddress: string
): string | null => {
  return window.localStorage.getItem(`cometh-connect-${walletAddress}`)
}

const createSignerAndWallet = async (
  API: API,
  userName?: string
): Promise<{
  publicKeyId: string
  signerAddress: string
  walletAddress: string
}> => {
  /* Create WebAuthn credentials */
  const {
    publicKeyX,
    publicKeyY,
    publicKeyId,
    signerAddress,
    deviceData,
    walletAddress
  } = await createWebAuthnSigner(API, userName)

  /* Create Wallet and Webauthn signer in db */
  await API.initWalletWithWebAuthn({
    walletAddress,
    publicKeyId,
    publicKeyX,
    publicKeyY,
    deviceData
  })

  return { publicKeyId, signerAddress, walletAddress }
}

const getSigner = async (
  API: API,
  walletAddress: string
): Promise<{
  publicKeyId: string
  signerAddress: string
}> => {
  const webAuthnSigners = await API.getWebAuthnSignersByWalletAddress(
    walletAddress
  )

  if (webAuthnSigners.length === 0)
    throw new Error(
      'New Domain detected. You need to add that domain as signer'
    )

  /* Retrieve potentiel WebAuthn credentials in storage */
  const localStorageWebauthnCredentials =
    _getWebauthnCredentialsInStorage(walletAddress)

  if (localStorageWebauthnCredentials) {
    /* Check if storage WebAuthn credentials exists in db */
    const registeredWebauthnSigner = await API.getWebAuthnSignerByPublicKeyId(
      walletAddress,
      JSON.parse(localStorageWebauthnCredentials).publicKeyId
    )

    /* If signer exists in db, instantiate WebAuthn signer  */
    if (registeredWebauthnSigner)
      return {
        publicKeyId: registeredWebauthnSigner.publicKeyId,
        signerAddress: registeredWebauthnSigner.signerAddress
      }
  }

  /* If no local storage or no match in db, Call Webauthn API to get current signer */
  let signatureParams
  try {
    signatureParams = await signWithWebAuthn(webAuthnSigners, 'SDK Connection')
  } catch {
    throw new Error(
      'New Domain detected. You need to add that domain as signer'
    )
  }

  const signingWebAuthnSigner = await API.getWebAuthnSignerByPublicKeyId(
    walletAddress,
    signatureParams.publicKeyId
  )

  /* Store WebAuthn credentials in storage */
  _setWebauthnCredentialsInStorage(
    walletAddress,
    signatureParams.publicKeyId,
    signatureParams.signerAddress
  )

  return {
    publicKeyId: signingWebAuthnSigner.publicKeyId,
    signerAddress: signingWebAuthnSigner.signerAddress
  }
}

export default {
  createCredential,
  sign,
  getWebAuthnSignature,
  waitWebAuthnSignerDeployment,
  isWebAuthnCompatible,
  createWebAuthnSigner,
  signWithWebAuthn,
  createSignerAndWallet,
  getSigner
}
