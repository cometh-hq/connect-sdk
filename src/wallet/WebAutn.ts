import { parseAuthenticatorData } from '@simplewebauthn/server/helpers'
import CBOR from 'cbor-js'
import { ec as EC } from 'elliptic'

import { hexArrayStr } from '../utils/utils'

const curve = new EC('p256')

const addOwner = (walletAddress: string): any => {
  const challenge = new TextEncoder().encode('connection')
  navigator.credentials
    .create({
      publicKey: {
        rp: {
          name: 'wallet'
        },
        user: {
          id: new TextEncoder().encode(walletAddress),
          name: 'user',
          displayName: 'user'
        },
        challenge,
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }]
      }
    })
    .then((attestationPayload: any) => {
      console.log(attestationPayload)
      const attestation = CBOR.decode(
        attestationPayload?.response?.attestationObject
      )
      const authData = parseAuthenticatorData(attestation.authData)
      const publicKey = CBOR.decode(authData?.credentialPublicKey?.buffer)
      const credentialId = authData?.credentialPublicKey

      const x = publicKey[-2]
      const y = publicKey[-3]
      const point = curve.curve.point(x, y)
      return { publicKey, credentialId, point }
    })
    .catch(console.error)
}

export default {
  addOwner
}
