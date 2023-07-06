import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { parseAuthenticatorData } from '@simplewebauthn/server/helpers'
import CBOR from 'cbor-js'
import { ec as EC } from 'elliptic'
import { ethers } from 'ethers'
import { SiweMessage } from 'siwe'
import { v4 } from 'uuid'

import { BLOCK_EVENT_GAP, networks, P256SignerCreationCode } from '../constants'
import { P256SignerFactory__factory } from '../contracts/types/factories'
import { API } from '../services'
import { derToRS, findSequence, hexArrayStr, parseHex } from '../utils/utils'
import { DeviceData, WebAuthnOwner } from '../wallet'
import { AlembicProvider } from '../wallet/AlembicProvider'
import deviceService from './deviceService'
import safeService from './safeService'
import siweService from './siweService'

const curve = new EC('p256')

const createCredential = async (
  signerName: string
): Promise<{
  point: any
  id: string
}> => {
  const challenge = new TextEncoder().encode('credentialCreation')

  const webAuthnCredentials: any = await navigator.credentials.create({
    publicKey: {
      rp: {
        name: 'wallet'
      },
      user: {
        id: new TextEncoder().encode(v4()),
        name: signerName,
        displayName: signerName
      },
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
    id: hexArrayStr(webAuthnCredentials.rawId)
  }
}

const sign = async (
  challenge: BufferSource,
  publicKeyCredential: PublicKeyCredentialDescriptor[]
): Promise<any> => {
  const assertionPayload: any = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: publicKeyCredential
    }
  })

  return assertionPayload
}

const getWebAuthnSignature = async (
  hash: string,
  publicKeyCredential: PublicKeyCredentialDescriptor[]
): Promise<{ encodedSignature: string; publicKeyId: string }> => {
  const challenge = parseHex(hash.slice(2))
  const assertionPayload = await sign(challenge, publicKeyCredential)
  const publicKeyId = hexArrayStr(assertionPayload.rawId)

  const {
    signature,
    authenticatorData,
    clientDataJSON: clientData
  } = assertionPayload.response

  const rs = derToRS(new Uint8Array(signature))

  const challengeOffset =
    findSequence(
      new Uint8Array(clientData),
      parseHex('226368616c6c656e6765223a')
    ) +
    12 +
    1

  const encodedSignature = ethers.utils.defaultAbiCoder.encode(
    ['bytes', 'bytes', 'uint256', 'uint256[2]'],
    [
      hexArrayStr(authenticatorData),
      hexArrayStr(clientData),
      challengeOffset,
      [hexArrayStr(rs[0]), hexArrayStr(rs[1])]
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

export async function platformAuthenticatorIsAvailable(): Promise<boolean> {
  if (!window.PublicKeyCredential)
    throw new Error('Error: Device does not support WebAuthn Authentification')

  const isUserVerifyingPlatformAuthenticatorAvailable =
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()

  if (!isUserVerifyingPlatformAuthenticatorAvailable)
    throw new Error(
      'Error: Device does not support WebAuthn Platform Authentification'
    )

  return isUserVerifyingPlatformAuthenticatorAvailable
}

export async function signWithWebAuthn(
  webAuthnOwners: WebAuthnOwner[],
  challenge: string
): Promise<{
  encodedSignature: string
  publicKeyId: string
}> {
  const publicKeyCredentials: PublicKeyCredentialDescriptor[] =
    webAuthnOwners.map((webAuthnOwner) => {
      return {
        id: parseHex(webAuthnOwner.publicKeyId),
        type: 'public-key'
      }
    })

  const { encodedSignature, publicKeyId } = await getWebAuthnSignature(
    ethers.utils.keccak256(ethers.utils.hashMessage(challenge)),
    publicKeyCredentials
  )

  return { encodedSignature, publicKeyId }
}

export async function createWalletWithWebAuthn(
  userId: string,
  chainId: string
): Promise<{
  publicKeyX: string
  publicKeyY: string
  publicKeyId: string
  signerAddress: string
}> {
  const webAuthnCredentials = await createCredential(userId)

  const publicKeyX = `0x${webAuthnCredentials.point.getX().toString(16)}`
  const publicKeyY = `0x${webAuthnCredentials.point.getY().toString(16)}`
  const publicKeyId = webAuthnCredentials.id

  const signerAddress = await predictSignerAddress(
    publicKeyX,
    publicKeyY,
    +chainId
  )

  return {
    publicKeyX,
    publicKeyY,
    publicKeyId,
    signerAddress
  }
}

export async function createOrGetWebAuthnOwner(
  userId: string,
  chainId: string,
  provider: StaticJsonRpcProvider,
  API: API
): Promise<{
  publicKeyId: string
  signerAddress: string
}> {
  const webAuthnOwners = await API.getWebAuthnOwnersByUserId(userId)

  if (webAuthnOwners.length !== 0) {
    const nonce = await API.getNonce(webAuthnOwners[0].walletAddress)
    const message: SiweMessage = siweService.createMessage(
      webAuthnOwners[0].walletAddress,
      nonce,
      +chainId
    )
    const { encodedSignature, publicKeyId } = await signWithWebAuthn(
      webAuthnOwners,
      message.prepareMessage()
    )

    const currentWebAuthnOwner = await API.getWebAuthnOwnerByPublicKeyId(
      <string>publicKeyId
    )
    if (!currentWebAuthnOwner) throw new Error('WebAuthn is undefined')

    const isSafeOwner = await safeService.isSafeOwner(
      currentWebAuthnOwner.walletAddress,
      currentWebAuthnOwner.signerAddress,
      provider
    )

    if (!isSafeOwner) throw new Error('WebAuthn is undefined')

    await API.connectToAlembicWallet({
      message,
      signature: safeService.formatWebAuthnSignatureForSafe(
        currentWebAuthnOwner.signerAddress,
        encodedSignature
      ),
      walletAddress: webAuthnOwners[0].walletAddress,
      userId
    })

    return {
      publicKeyId: currentWebAuthnOwner.publicKeyId,
      signerAddress: currentWebAuthnOwner.signerAddress
    }
  } else {
    const { publicKeyX, publicKeyY, publicKeyId, signerAddress } =
      await createWalletWithWebAuthn(userId, chainId)

    await API.createWalletWithWebAuthn({
      walletAddress: await API.getWalletAddress(signerAddress),
      signerName: userId,
      publicKeyId,
      publicKeyX,
      publicKeyY,
      deviceData: deviceService.getDeviceData(),
      userId
    })

    await waitWebAuthnSignerDeployment(
      publicKeyX,
      publicKeyY,
      +chainId,
      provider
    )

    return { publicKeyId, signerAddress }
  }
}

export default {
  createCredential,
  sign,
  getWebAuthnSignature,
  predictSignerAddress,
  waitWebAuthnSignerDeployment,
  platformAuthenticatorIsAvailable,
  createWalletWithWebAuthn,
  signWithWebAuthn,
  createOrGetWebAuthnOwner
}
