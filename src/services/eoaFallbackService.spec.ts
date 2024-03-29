/** @jest-environment jsdom */
import { defaultEncryptionSalt } from '../constants'
import { getFunctionMock } from '../tests/unit/utils'
import * as utils from '../utils/utils'
import eoaFallbackService from './eoaFallbackService'
import { getRandomIV } from './randomIvService'

const WALLET_ADDRESS = '0x5B76Bb156C4E9Aa322143d0061AFBd856482648D'
const privateKey =
  '0x58476d0865927d3536ee46ad35d36899e5e362cf0825800f453f6ef7c8547dbe'
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

  describe('formatStorageValue', () => {
    const encryptedPrivateKey =
      '93OuZvzQhfsUPuxGnJ4FLIw0P4wrGFw3E0HiaH1rfRqWQFvXoYRREWG00g5FpahVSEfU'
    const iv = 'SkYTzy3OmELWXi2yfk7mIg=='
    const signerAddress = '0x_signer_Address'

    it('Given a encrypted key value, when formatting for localstorage, then return the right format', async () => {
      const storageValue = eoaFallbackService.formatStorageValue(
        encryptedPrivateKey,
        iv,
        signerAddress
      )

      expect(storageValue).toEqual(
        JSON.stringify({ encryptedPrivateKey, iv, signerAddress })
      )
    })
  })

  describe('unformatStorageValue', () => {
    const encryptedPrivateKey =
      '93OuZvzQhfsUPuxGnJ4FLIw0P4wrGFw3E0HiaH1rfRqWQFvXoYRREWG00g5FpahVSEfU'
    const iv = 'SkYTzy3OmELWXi2yfk7mIg=='
    const storageValue = JSON.stringify({ encryptedPrivateKey, iv })

    it('Given a fallbackLocalStorage value, when unformatting the value, then return the right format', async () => {
      const unformattedStorageValue =
        eoaFallbackService.unFormatStorageValue(storageValue)

      expect(unformattedStorageValue).toEqual(JSON.parse(storageValue))
    })
  })
})
