import WebAuthnUtils from './WebAuthnUtils'

const DEPLOYED_WEBAUTHN_SIGNER_ADDRESS =
  '0xc4c07CAD43fF6249c20129A2928D50D23A75fb09'
const CHAIN_ID = 137
const publicKey_X =
  '0xaf0b3c3d191a70a11e2b0b0bc6216f3b960ad20dc0bb34920348fe7852e68d7a'
const publicKey_Y =
  '0x40ed49be1573e8a5096adfefc36dfbdff42f1be69eed8b5355a08755ba7c17bc'

describe('WebAuthnService', () => {
  describe('predictSafeAddress', () => {
    it('Given an x and y, when predicting a deployed signer address, then return the correct address', async () => {
      const predictedAddress = await WebAuthnUtils.predictSignerAddress(
        publicKey_X,
        publicKey_Y,
        CHAIN_ID
      )

      expect(predictedAddress).toEqual(DEPLOYED_WEBAUTHN_SIGNER_ADDRESS)
    })
  })
})
