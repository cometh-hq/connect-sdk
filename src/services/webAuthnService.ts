import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { parseAuthenticatorData } from '@simplewebauthn/server/helpers'
import CBOR from 'cbor-js'
import { ec as EC } from 'elliptic'
import { defaultAbiCoder, hashMessage, keccak256 } from 'ethers/lib/utils'
import psl from 'psl'
import { v4 } from 'uuid'

import { BLOCK_EVENT_GAP, challengePrefix } from '../constants'
import { P256SignerFactory__factory } from '../contracts/types/factories'
import { API } from '../services'
import * as utils from '../utils/utils'
import { DeviceData, webAuthnOptions, WebAuthnSigner } from '../wallet'
import { ComethProvider } from '../wallet/ComethProvider'
import {
  NoPasskeySignerFoundInDBError,
  NoPasskeySignerFoundInDeviceError,
  PasskeyCreationError,
  RetrieveWalletFromPasskeyError,
  SignerNotOwnerError
} from '../wallet/errors'
import deviceService from './deviceService'
import safeService from './safeService'

const _formatCreatingRpId = (): { name: string; id?: string } => {
  return psl.parse(window.location.host).domain
    ? {
        name: psl.parse(window.location.host).domain,
        id: psl.parse(window.location.host).domain
      }
    : { name: 'localhost' }
}

const _formatSigningRpId = (): string | undefined => {
  return psl.parse(window.location.host).domain || undefined
}

const createCredential = async (
  webAuthnOptions: webAuthnOptions,
  passKeyName?: string
): Promise<{
  publicKeyX: string
  publicKeyY: string
  publicKeyId: string
  publicKeyAlgorithm: number
}> => {
  try {
    const challenge = new TextEncoder().encode('credentialCreation')
    const name = passKeyName || 'Cometh Connect'
    const authenticatorSelection = webAuthnOptions?.authenticatorSelection
    const extensions = webAuthnOptions?.extensions

    const webAuthnCredentials: any = await navigator.credentials.create({
      publicKey: {
        rp: _formatCreatingRpId(),
        user: {
          id: new TextEncoder().encode(v4()),
          name,
          displayName: name
        },
        attestation: 'none',
        authenticatorSelection,
        timeout: 30000,
        challenge,
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' }
        ],
        extensions
      }
    })

    const attestationObject = webAuthnCredentials?.response?.attestationObject

    let attestation
    if (attestationObject instanceof ArrayBuffer) {
      attestation = CBOR.decode(attestationObject)
    } else {
      attestation = CBOR.decode(attestationObject.buffer)
    }

    const authData = parseAuthenticatorData(attestation.authData)

    const publicKey = CBOR.decode(authData?.credentialPublicKey?.buffer)
    const x = publicKey[-2]
    const y = publicKey[-3]
    const curve = new EC('p256')
    const point = curve.curve.point(x, y)

    const publicKeyAlgorithm =
      webAuthnCredentials.response.getPublicKeyAlgorithm()

    const publicKeyX = `0x${point.getX().toString(16)}`
    const publicKeyY = `0x${point.getY().toString(16)}`
    const publicKeyId = utils.hexArrayStr(webAuthnCredentials.rawId)

    return {
      publicKeyX,
      publicKeyY,
      publicKeyId,
      publicKeyAlgorithm
    }
  } catch (error) {
    throw new PasskeyCreationError()
  }
}

const signWithCredential = async (
  challenge: BufferSource,
  publicKeyCredential?: PublicKeyCredentialDescriptor[]
): Promise<any> => {
  const assertionPayload: any = await navigator.credentials.get({
    publicKey: {
      challenge,
      rpId: _formatSigningRpId(),
      allowCredentials: publicKeyCredential || [],
      userVerification: 'required',
      timeout: 30000
    }
  })

  return assertionPayload
}

const getWebAuthnSignature = async (
  hash: string,
  publicKeyCredential?: PublicKeyCredentialDescriptor[]
): Promise<{ encodedSignature: string; publicKeyId: string }> => {
  const challenge = utils.parseHex(hash.slice(2))
  const assertionPayload = await signWithCredential(
    challenge,
    publicKeyCredential
  )
  const publicKeyId = utils.hexArrayStr(assertionPayload.rawId)

  const {
    signature,
    authenticatorData,
    clientDataJSON: clientData
  } = assertionPayload.response

  const rs = utils.derToRS(new Uint8Array(signature))

  const challengeOffset = utils.getChallengeOffset(clientData, challengePrefix)

  const encodedSignature = defaultAbiCoder.encode(
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

const isWebAuthnCompatible = async (
  webAuthnOptions: webAuthnOptions
): Promise<boolean> => {
  try {
    if (!window.PublicKeyCredential) return false

    if (
      webAuthnOptions?.authenticatorSelection?.authenticatorAttachment ===
      'platform'
    ) {
      const isUserVerifyingPlatformAuthenticatorAvailable =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()

      if (!isUserVerifyingPlatformAuthenticatorAvailable) return false
    }

    return true
  } catch {
    return false
  }
}

const signWithWebAuthn = async (
  challenge: string,
  webAuthnSigners?: WebAuthnSigner[]
): Promise<{
  encodedSignature: string
  publicKeyId: string
}> => {
  let publicKeyCredentials: PublicKeyCredentialDescriptor[] | undefined
  if (webAuthnSigners) {
    publicKeyCredentials = webAuthnSigners.map((webAuthnSigner) => {
      return {
        id: utils.parseHex(webAuthnSigner.publicKeyId),
        type: 'public-key'
      }
    })
  }

  const { encodedSignature, publicKeyId } = await getWebAuthnSignature(
    keccak256(hashMessage(challenge)),
    publicKeyCredentials
  )

  return { encodedSignature, publicKeyId }
}

const setWebauthnCredentialsInStorage = (
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

const getWebauthnCredentialsInStorage = (
  walletAddress: string
): string | null => {
  return window.localStorage.getItem(`cometh-connect-${walletAddress}`)
}

const getSignerFromCredentials = async ({
  API,
  publicKeyX,
  publicKeyY,
  walletAddress
}: {
  API: API
  publicKeyX: string
  publicKeyY: string
  walletAddress?: string
}): Promise<{
  deviceData: DeviceData
  signerAddress: string
  walletAddress: string
}> => {
  const deviceData = deviceService.getDeviceData()
  const signerAddress = await API.predictWebAuthnSignerAddress({
    publicKeyX,
    publicKeyY
  })
  walletAddress = walletAddress || (await API.getWalletAddress(signerAddress))

  return {
    deviceData,
    signerAddress,
    walletAddress
  }
}

const getSigner = async ({
  API,
  walletAddress,
  provider
}: {
  API: API
  walletAddress: string
  provider: StaticJsonRpcProvider
}): Promise<{
  publicKeyId: string
  signerAddress: string
}> => {
  const webAuthnSigners = await API.getWebAuthnSignersByWalletAddress(
    walletAddress
  )

  if (webAuthnSigners.length === 0) throw new NoPasskeySignerFoundInDBError()

  /* Retrieve potentiel WebAuthn credentials in storage */
  const localStorageWebauthnCredentials =
    getWebauthnCredentialsInStorage(walletAddress)

  if (localStorageWebauthnCredentials) {
    /* Check if storage WebAuthn credentials exists in db */
    const registeredWebauthnSigner = await API.getWebAuthnSignerByPublicKeyId(
      JSON.parse(localStorageWebauthnCredentials).publicKeyId
    )

    const isOwner = await safeService.isSigner(
      registeredWebauthnSigner.signerAddress,
      walletAddress,
      provider,
      API
    )

    if (!isOwner) throw new SignerNotOwnerError()

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
    signatureParams = await signWithWebAuthn('SDK Connection', webAuthnSigners)
  } catch {
    throw new NoPasskeySignerFoundInDeviceError()
  }

  const signingWebAuthnSigner = await API.getWebAuthnSignerByPublicKeyId(
    signatureParams.publicKeyId
  )

  const isOwner = await safeService.isSigner(
    signingWebAuthnSigner.signerAddress,
    walletAddress,
    provider,
    API
  )

  if (!isOwner) throw new SignerNotOwnerError()

  /* Store WebAuthn credentials in storage */
  setWebauthnCredentialsInStorage(
    walletAddress,
    signatureParams.publicKeyId,
    signatureParams.signerAddress
  )

  return {
    publicKeyId: signingWebAuthnSigner.publicKeyId,
    signerAddress: signingWebAuthnSigner.signerAddress
  }
}

const retrieveWalletAddressFromSigner = async (API: API): Promise<string> => {
  let publicKeyId: string

  try {
    ;({ publicKeyId } = await signWithWebAuthn('Retrieve user wallet'))
  } catch {
    throw new RetrieveWalletFromPasskeyError()
  }

  const signingWebAuthnSigner = await API.getWebAuthnSignerByPublicKeyId(
    publicKeyId
  )
  if (!signingWebAuthnSigner) throw new NoPasskeySignerFoundInDBError()

  const { walletAddress, signerAddress } = signingWebAuthnSigner

  setWebauthnCredentialsInStorage(walletAddress, publicKeyId, signerAddress)

  return walletAddress
}

export default {
  createCredential,
  signWithCredential,
  getWebAuthnSignature,
  waitWebAuthnSignerDeployment,
  isWebAuthnCompatible,
  getSignerFromCredentials,
  signWithWebAuthn,
  getSigner,
  retrieveWalletAddressFromSigner,
  setWebauthnCredentialsInStorage,
  getWebauthnCredentialsInStorage
}
