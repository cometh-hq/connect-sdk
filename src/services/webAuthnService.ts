import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { parseAuthenticatorData } from '@simplewebauthn/server/helpers'
import CBOR from 'cbor-js'
import { ec as EC } from 'elliptic'
import { ethers } from 'ethers'
import psl from 'psl'
import { SiweMessage } from 'siwe'
import { v4 } from 'uuid'

import {
  BLOCK_EVENT_GAP,
  challengePrefix,
  networks,
  P256SignerCreationCode
} from '../constants'
import { P256SignerFactory__factory } from '../contracts/types/factories'
import { API } from '../services'
import * as utils from '../utils/utils'
import { DeviceData, WebAuthnOwner } from '../wallet'
import { AlembicProvider } from '../wallet/AlembicProvider'
import deviceService from './deviceService'
import safeService from './safeService'
import siweService from './siweService'

const createCredential = async (): Promise<{
  point: any
  id: string
}> => {
  const curve = new EC('p256')
  const challenge = new TextEncoder().encode('credentialCreation')

  const webAuthnCredentials: any = await navigator.credentials.create({
    publicKey: {
      rp: {
        name: 'test'
        /*         id: psl.parse(window.location.host).domain */
      },
      user: {
        id: new TextEncoder().encode(v4()),
        name: 'Cometh Connect',
        displayName: 'Cometh Connect'
      },
      authenticatorSelection: { authenticatorAttachment: 'platform' },
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
  const credentialId = utils.hexArrayStr(webAuthnCredentials.rawId)

  localStorage.setItem('credentialId', credentialId)

  return {
    point,
    id: utils.hexArrayStr(webAuthnCredentials.rawId)
  }
}

const createWebAuthnSigner = async (
  chainId: number
): Promise<{
  publicKeyX: string
  publicKeyY: string
  publicKeyId: string
  signerAddress: string
  deviceData: DeviceData
}> => {
  const webAuthnCredentials = await createCredential()

  const publicKeyX = `0x${webAuthnCredentials.point.getX().toString(16)}`
  const publicKeyY = `0x${webAuthnCredentials.point.getY().toString(16)}`
  const publicKeyId = webAuthnCredentials.id
  const signerAddress = await predictSignerAddress(
    publicKeyX,
    publicKeyY,
    chainId
  )
  const deviceData = deviceService.getDeviceData()

  return {
    publicKeyX,
    publicKeyY,
    publicKeyId,
    signerAddress,
    deviceData
  }
}

const sign = async (
  challenge: BufferSource,
  publicKeyCredential: PublicKeyCredentialDescriptor[]
): Promise<any> => {
  const assertionPayload: any = await navigator.credentials.get({
    publicKey: {
      challenge,
      /*   rpId: psl.parse(window.location.host).domain, */
      allowCredentials: publicKeyCredential
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

const predictSignerAddress = async (
  publicKey_X: string,
  publicKey_Y: string,
  chainId: number
): Promise<string> => {
  const deploymentCode = ethers.utils.keccak256(
    ethers.utils.solidityPack(
      ['bytes', 'uint256', 'uint256'],
      [P256SignerCreationCode, publicKey_X, publicKey_Y]
    )
  )

  const salt = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['uint256', 'uint256'],
      [publicKey_X, publicKey_Y]
    )
  )

  return ethers.utils.getCreate2Address(
    networks[chainId].P256FactoryContractAddress,
    salt,
    deploymentCode
  )
}

const waitWebAuthnSignerDeployment = async (
  publicKey_X: string,
  publicKey_Y: string,
  chainId: number,
  provider: StaticJsonRpcProvider | AlembicProvider
): Promise<string> => {
  const P256FactoryInstance = await P256SignerFactory__factory.connect(
    networks[chainId].P256FactoryContractAddress,
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
  webAuthnOwners: WebAuthnOwner[],
  challenge: string
): Promise<{
  encodedSignature: string
  publicKeyId: string
}> => {
  const publicKeyCredentials: PublicKeyCredentialDescriptor[] =
    webAuthnOwners.map((webAuthnOwner) => {
      return {
        id: utils.parseHex(webAuthnOwner.publicKeyId),
        type: 'public-key'
      }
    })

  const { encodedSignature, publicKeyId } = await getWebAuthnSignature(
    ethers.utils.keccak256(ethers.utils.hashMessage(challenge)),
    publicKeyCredentials
  )

  return { encodedSignature, publicKeyId }
}

const createOrGetWebAuthnOwner = async (
  token: string,
  chainId: string,
  provider: StaticJsonRpcProvider,
  API: API,
  walletAddress: string | undefined
): Promise<{
  publicKeyId: string
  signerAddress: string
}> => {
  const webAuthnOwners = await API.getWebAuthnOwnersByUser(token)

  if (webAuthnOwners.length === 0) {
    if (walletAddress)
      throw new Error(
        'New Domain detected. You need to add that domain as signer'
      )

    const { publicKeyX, publicKeyY, publicKeyId, signerAddress, deviceData } =
      await createWebAuthnSigner(+chainId)

    await API.connectWithWebAuthn({
      token,
      walletAddress: await API.getWalletAddress(signerAddress),
      publicKeyId,
      publicKeyX,
      publicKeyY,
      deviceData
    })

    await waitWebAuthnSignerDeployment(
      publicKeyX,
      publicKeyY,
      +chainId,
      provider
    )

    return { publicKeyId, signerAddress }
  } else {
    let signatureParams

    const nonce = await API.getNonce(webAuthnOwners[0].walletAddress)
    const message: SiweMessage = siweService.createMessage(
      webAuthnOwners[0].walletAddress,
      nonce,
      +chainId
    )

    try {
      signatureParams = await signWithWebAuthn(
        webAuthnOwners,
        message.prepareMessage()
      )
    } catch {
      throw new Error(
        'New Domain detected. You need to add that domain as signer'
      )
    }

    const currentWebAuthnOwner = await API.getWebAuthnOwnerByPublicKeyId(
      token,
      signatureParams.publicKeyId
    )

    await API.connectToAlembicWallet({
      message,
      signature: safeService.formatWebAuthnSignatureForSafe(
        currentWebAuthnOwner.signerAddress,
        signatureParams.encodedSignature
      ),
      walletAddress: currentWebAuthnOwner.walletAddress
    })

    return {
      publicKeyId: currentWebAuthnOwner.publicKeyId,
      signerAddress: currentWebAuthnOwner.signerAddress
    }
  }
}

export default {
  createCredential,
  sign,
  getWebAuthnSignature,
  predictSignerAddress,
  waitWebAuthnSignerDeployment,
  isWebAuthnCompatible,
  createWebAuthnSigner,
  signWithWebAuthn,
  createOrGetWebAuthnOwner
}
