import { Web3Provider } from '@ethersproject/providers'
import { parseAuthenticatorData } from '@simplewebauthn/server/helpers'
import CBOR from 'cbor-js'
import { ec as EC } from 'elliptic'
import { ethers } from 'ethers'

import { BLOCK_EVENT_GAP, networks, P256SignerCreationCode } from '../constants'
import { P256SignerFactory__factory } from '../contracts/types/factories'
import { derToRS, findSequence, hexArrayStr, parseHex } from '../utils/utils'
import { AlembicProvider } from './AlembicProvider'

const curve = new EC('p256')
const PUBLIC_KEY_X = 'public-key-x'
const PUBLIC_KEY_Y = 'public-key-y'
const PUBLIC_KEY_ID_KEY = 'public-key-id'

const createCredentials = async (userId: string): Promise<any> => {
  const challenge = new TextEncoder().encode('connection')

  const webAuthnCredentials = await navigator.credentials
    .create({
      publicKey: {
        rp: {
          name: 'wallet'
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: 'user',
          displayName: 'user'
        },
        challenge,
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }]
      }
    })
    .then((attestationPayload: any) => {
      const attestation = CBOR.decode(
        attestationPayload?.response?.attestationObject
      )
      const authData = parseAuthenticatorData(attestation.authData)
      const publicKey = CBOR.decode(authData?.credentialPublicKey?.buffer)
      const x = publicKey[-2]
      const y = publicKey[-3]
      const point = curve.curve.point(x, y)

      window.localStorage.setItem(PUBLIC_KEY_X, point.getX().toString(16))
      window.localStorage.setItem(PUBLIC_KEY_Y, point.getY().toString(16))
      window.localStorage.setItem(
        PUBLIC_KEY_ID_KEY,
        hexArrayStr(attestationPayload.rawId)
      )

      return {
        point,
        id: hexArrayStr(attestationPayload.rawId)
      }
    })
    .catch(console.error)

  return webAuthnCredentials
}

const _sign = async (
  challenge: BufferSource,
  publicKeyId: BufferSource
): Promise<any> => {
  const assertionPayload: any = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [
        {
          id: publicKeyId,
          type: 'public-key'
        }
      ]
    }
  })
  return assertionPayload?.response
}

const getWebAuthnSignature = async (
  hash: string,
  publicKeyId: string
): Promise<string> => {
  const formattedPublicKeyId = parseHex(publicKeyId)
  const challenge = parseHex(hash.slice(2))

  const {
    signature,
    authenticatorData,
    clientDataJSON: clientData
  } = await _sign(challenge, formattedPublicKeyId)

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
  publicKeyX: string,
  publicKeyY: string,
  chainId: number
): Promise<string> => {
  const deploymentCode = ethers.utils.keccak256(
    ethers.utils.solidityPack(
      ['bytes', 'uint256', 'uint256'],
      [P256SignerCreationCode, publicKeyX, publicKeyY]
    )
  )

  const salt = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['uint256', 'uint256'],
      [publicKeyX, publicKeyY]
    )
  )

  return ethers.utils.getCreate2Address(
    networks[chainId].P256FactoryContractAddress,
    salt,
    deploymentCode
  )
}

const waitWebAuthnSignerDeployment = async (
  publicKeyX: string,
  publicKeyY: string,
  chainId: number,
  provider: Web3Provider | AlembicProvider
): Promise<string> => {
  const P256FactoryInstance = await P256SignerFactory__factory.connect(
    networks[chainId].P256FactoryContractAddress,
    provider
  )

  let signerDeploymentEvent: any = []

  while (signerDeploymentEvent.length === 0) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    signerDeploymentEvent = await P256FactoryInstance.queryFilter(
      P256FactoryInstance.filters.NewSignerCreated(publicKeyX, publicKeyY),
      BLOCK_EVENT_GAP
    )
  }

  return signerDeploymentEvent[0].args.signer
}

export default {
  createCredentials,
  getWebAuthnSignature,
  predictSignerAddress,
  waitWebAuthnSignerDeployment
}
