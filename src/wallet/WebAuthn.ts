import { parseAuthenticatorData } from '@simplewebauthn/server/helpers'
import CBOR from 'cbor-js'
import { ec as EC } from 'elliptic'
import { ethers } from 'ethers'

import { derToRS, findSequence, hexArrayStr, parseHex } from '../utils/utils'

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
  publicKey_Id: BufferSource
): Promise<any> => {
  const assertionPayload: any = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [
        {
          id: publicKey_Id,
          type: 'public-key'
        }
      ]
    }
  })
  return assertionPayload?.response
}

const getWebAuthnSignature = async (
  safeTxHash: string,
  publicKey_Id: string
): Promise<string> => {
  const formattedPublicKeyId = parseHex(publicKey_Id)
  const metaTxHash = safeTxHash
  const challenge = parseHex(metaTxHash.slice(2))

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

export default {
  createCredentials,
  getWebAuthnSignature
}
