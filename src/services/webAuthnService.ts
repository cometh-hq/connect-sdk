import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { parseAuthenticatorData } from '@simplewebauthn/server/helpers'
import CBOR from 'cbor-js'
import { ec as EC } from 'elliptic'
import { ethers } from 'ethers'
import { v4 } from 'uuid'

import { BLOCK_EVENT_GAP, networks, P256SignerCreationCode } from '../constants'
import { P256SignerFactory__factory } from '../contracts/types/factories'
import { derToRS, findSequence, hexArrayStr, parseHex } from '../utils/utils'
import { AlembicProvider } from '../wallet/AlembicProvider'

const curve = new EC('p256')
const CREDENTIAL_ID = 'credentialId'

const getCurrentPublicKeyId = (walletAddress: string): string | null => {
  return window.localStorage.getItem(`${CREDENTIAL_ID}-${walletAddress}`)
}

const createCredentials = async (
  signerName: string
): Promise<{
  point: any
  id: string
}> => {
  const challenge = new TextEncoder().encode('connection')

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

const updateCurrentWebAuthnOwner = (
  publicKeyId: string,
  walletAddress: string
): void => {
  window.localStorage.setItem(`${CREDENTIAL_ID}-${walletAddress}`, publicKeyId)
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

  return assertionPayload?.response
}

const getWebAuthnSignature = async (
  hash: string,
  publicKeyId: string
): Promise<string> => {
  const challenge = parseHex(hash.slice(2))

  const {
    signature,
    authenticatorData,
    clientDataJSON: clientData
  } = await sign(challenge, [
    {
      id: parseHex(publicKeyId),
      type: 'public-key'
    }
  ])

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

  return encodedSignature
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
  if (!window.PublicKeyCredential) {
    console.log('Error: Browser does not support webAuthn')
    return false
  }

  const isUserVerifyingPlatformAuthenticatorAvailable =
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()

  if (!isUserVerifyingPlatformAuthenticatorAvailable) {
    console.log('Error: Platform not supported for WebAuthn')
  }

  return isUserVerifyingPlatformAuthenticatorAvailable
}

export default {
  getCurrentPublicKeyId,
  createCredentials,
  updateCurrentWebAuthnOwner,
  getWebAuthnSignature,
  predictSignerAddress,
  waitWebAuthnSignerDeployment,
  platformAuthenticatorIsAvailable
}
