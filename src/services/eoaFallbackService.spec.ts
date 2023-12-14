import { defaultEncryptionSalt, Pbkdf2Iterations } from '../constants'
import * as cryptolib from '../services/cryptoService'
import { getFunctionMock } from '../tests/unit/utils'
import * as utils from '../utils/utils'
import eoaFallbackService from './eoaFallbackService'

const WALLET_ADDRESS = '0x5B76Bb156C4E9Aa322143d0061AFBd856482648D'
const encryptedPrivateKey = new ArrayBuffer(0)

jest.mock('../services/cryptoService', () => ({
  pbkdf2: jest.fn(),
  encryptAESCBC: jest.fn(),
  decryptAESCBC: jest.fn(),
  getRandomIV: jest.fn(),
  encodeWalletAddressToUTF8: jest.fn(),
  encodeSaltToUTF8: jest.fn(),
  encodePrivateKeyToUTF8: jest.fn(),
  decodePrivateKeyFromUTF8: jest.fn()
}))

jest.mock('../utils/utils', () => ({
  arrayBufferToBase64: jest.fn(),
  uint8ArrayToBase64: jest.fn()
}))

describe('eoaFallbackService', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  beforeEach(() => {
    getFunctionMock(cryptolib.pbkdf2).mockResolvedValue('encryption_key')
    getFunctionMock(cryptolib.encryptAESCBC).mockResolvedValue(
      encryptedPrivateKey
    )
    getFunctionMock(cryptolib.getRandomIV).mockReturnValue('iv')

    getFunctionMock(cryptolib.decryptAESCBC).mockResolvedValue('decrypted_key')
    getFunctionMock(cryptolib.encodeWalletAddressToUTF8).mockReturnValue(
      'encoded_walletAddress'
    )
    getFunctionMock(cryptolib.encodeSaltToUTF8).mockReturnValue('encoded_salt')
    getFunctionMock(cryptolib.encodePrivateKeyToUTF8).mockReturnValue(
      'encoded_privateKey'
    )
    getFunctionMock(cryptolib.decodePrivateKeyFromUTF8).mockReturnValue(
      'decoded_privateKey'
    )
    getFunctionMock(utils.arrayBufferToBase64).mockReturnValue({})
    getFunctionMock(utils.uint8ArrayToBase64).mockReturnValue({})
  })
  describe('encryptEoaFallback', () => {
    const privateKey =
      '0x58476d0865927d3536ee46ad35d36899e5e362cf0825800f453f6ef7c8547dbe'
    it('Given a walletAddress with transactionData, when predicting transaction Hash, then return the correct safe txHash', async () => {
      await eoaFallbackService.encryptEoaFallback(
        WALLET_ADDRESS,
        privateKey,
        defaultEncryptionSalt
      )

      expect(cryptolib.encodeWalletAddressToUTF8).toHaveBeenCalledWith(
        WALLET_ADDRESS
      )
      expect(cryptolib.encodeSaltToUTF8).toHaveBeenCalledWith(
        defaultEncryptionSalt
      )
      expect(cryptolib.pbkdf2).toHaveBeenCalledWith(
        'encoded_walletAddress',
        'encoded_salt',
        Pbkdf2Iterations
      )
      expect(cryptolib.encodePrivateKeyToUTF8).toHaveBeenCalledWith(privateKey)
      expect(cryptolib.encryptAESCBC).toHaveBeenCalledWith(
        'encryption_key',
        'iv',
        'encoded_privateKey'
      )
    })
  })

  describe('decryptEoaFallback', () => {
    const encryptedPrivateKey = new ArrayBuffer(0)
    const iv = new ArrayBuffer(0)

    it('Given a walletAddress with transactionData, when predicting transaction Hash, then return the correct safe txHash', async () => {
      await eoaFallbackService.decryptEoaFallback(
        WALLET_ADDRESS,
        encryptedPrivateKey,
        iv,
        defaultEncryptionSalt
      )

      expect(cryptolib.encodeWalletAddressToUTF8).toHaveBeenCalledWith(
        WALLET_ADDRESS
      )
      expect(cryptolib.encodeSaltToUTF8).toHaveBeenCalledWith(
        defaultEncryptionSalt
      )
      expect(cryptolib.pbkdf2).toHaveBeenCalledWith(
        'encoded_walletAddress',
        'encoded_salt',
        Pbkdf2Iterations
      )
      expect(cryptolib.decryptAESCBC).toHaveBeenCalledWith(
        'encryption_key',
        iv,
        encryptedPrivateKey
      )
      expect(cryptolib.decodePrivateKeyFromUTF8).toHaveBeenCalledWith(
        'decrypted_key'
      )
    })
  })
})
