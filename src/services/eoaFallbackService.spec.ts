/** @jest-environment jsdom */
import { defaultEncryptionSalt } from '../constants'
import { getFunctionMock } from '../tests/unit/utils'
import * as utils from '../utils/utils'
import eoaFallbackService from './eoaFallbackService'
import { getRandomIV } from './randomIvService'

const WALLET_ADDRESS = '0x5B76Bb156C4E9Aa322143d0061AFBd856482648D'

const testIV = new Uint8Array([
  74, 70, 19, 207, 45, 206, 152, 66, 214, 94, 45, 178, 126, 78, 230, 34
])

jest.mock('./randomIvService', () => ({
  getRandomIV: jest.fn()
}))

describe('eoaFallbackService', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  beforeEach(() => {
    getFunctionMock(getRandomIV).mockReturnValue(testIV)
  })

  describe('encryptEoaFallback', () => {
    const privateKey =
      '0x58476d0865927d3536ee46ad35d36899e5e362cf0825800f453f6ef7c8547dbe'
    it('Given a walletAddress privateKey and base salt, when encrypting privateKey, then return the correct encrypted key', async () => {
      const { encryptedPrivateKey, iv } =
        await eoaFallbackService.encryptEoaFallback(
          WALLET_ADDRESS,
          privateKey,
          defaultEncryptionSalt
        )

      expect(encryptedPrivateKey).toBe(
        '93OuZvzQhfsUPuxGnJ4FLIw0P4wrGFw3E0HiaH1rfRqWQFvXoYRREWG00g5FpahVSEfU+xBGnQf/WjkCyq0LFpXtYbjzakyxiqDYsoPdtlU='
      )

      expect(iv).toBe('SkYTzy3OmELWXi2yfk7mIg==')
    })
  })

  describe('decryptEoaFallback', () => {
    const encryptedPrivateKey = utils.base64ToArrayBuffer(
      '93OuZvzQhfsUPuxGnJ4FLIw0P4wrGFw3E0HiaH1rfRqWQFvXoYRREWG00g5FpahVSEfU+xBGnQf/WjkCyq0LFpXtYbjzakyxiqDYsoPdtlU='
    )

    it('Given decryption params, when decrypting the encrypted privateKey, then return the correct privateKey as Hex', async () => {
      const privateKey = await eoaFallbackService.decryptEoaFallback(
        WALLET_ADDRESS,
        encryptedPrivateKey,
        testIV,
        defaultEncryptionSalt
      )

      expect(privateKey).toBe(
        '0x58476d0865927d3536ee46ad35d36899e5e362cf0825800f453f6ef7c8547dbe'
      )
    })
  })
})
