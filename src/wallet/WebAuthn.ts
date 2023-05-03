import { parseAuthenticatorData } from '@simplewebauthn/server/helpers'
import CBOR from 'cbor-js'
import { ec as EC } from 'elliptic'

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
      window.localStorage.setItem(PUBLIC_KEY_ID_KEY, attestationPayload.id)

      return {
        point,
        id: attestationPayload.id
      }
    })
    .catch(console.error)

  return webAuthnCredentials
}

export default {
  createCredentials
}
