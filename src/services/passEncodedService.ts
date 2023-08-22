import { ethers, Wallet } from 'ethers'

import { Pbkdf2Iterations } from '../constants'
import * as cryptolib from '../services/cryptoService'
import * as utils from '../utils/utils'
import { API } from './API'

const getRandomPrivateKey = (): Uint8Array => {
  const array = new Uint8Array(32)
  cryptolib.getRandomValues(array)
  return array
}

const getRandomIV = (): Uint8Array => {
  const array = new Uint8Array(16)
  cryptolib.getRandomValues(array)
  return array
}

export const connectEncryptedWallet = async (
  password: string,
  userId: string,
  token: string,
  API: API
): Promise<Wallet> => {
  const encodedPassword = utils._encodeUTF8(password)
  const encodedUserId = utils._encodeUTF8(userId)
  const iterations = Pbkdf2Iterations

  const passwordDerivedKey = await cryptolib.pbkdf2(
    encodedPassword,
    encodedUserId,
    iterations
  )

  const passwordHash = await cryptolib.pbkdf2(
    passwordDerivedKey,
    encodedPassword,
    1
  )

  const { encryptedEncryptionKey, encryptedEncryptionKeyIV } =
    await API.getEncryptionKey(token, utils.bufferToBase64(passwordHash))

  const encryptionKey = await cryptolib.decryptAESCBC(
    passwordDerivedKey,
    utils.bufferToArrayBuffer(encryptedEncryptionKeyIV),
    utils.bufferToArrayBuffer(encryptedEncryptionKey)
  )

  const { encryptedMnemonic, encryptedMnemonicIV } =
    await API.getEncryptedWallet(token, utils.bufferToBase64(passwordHash))

  const mnemonic = await cryptolib.decryptAESCBC(
    encryptionKey,
    utils.bufferToArrayBuffer(encryptedMnemonicIV),
    utils.bufferToArrayBuffer(encryptedMnemonic)
  )
  const wallet = ethers.Wallet.fromMnemonic(utils._decodeUTF8(mnemonic))
  return wallet
}

export const createEncryptedWallet = async (
  password: string,
  userId: string,
  token: string,
  API: API
): Promise<Wallet> => {
  const encryptionKey = getRandomPrivateKey()

  const encodedPassword = utils._encodeUTF8(password)
  const encodedUserId = utils._encodeUTF8(userId)
  const iterations = Pbkdf2Iterations
  const passwordDerivedKey = await cryptolib.pbkdf2(
    encodedPassword,
    encodedUserId,
    iterations
  )
  const passwordHash = await cryptolib.pbkdf2(
    passwordDerivedKey,
    encodedPassword,
    1
  )

  const iv = getRandomIV()
  const encryptedEncryptionKey = await cryptolib.encryptAESCBC(
    passwordDerivedKey,
    iv,
    encryptionKey
  )

  const account = {
    token,
    iterations,
    passwordHash: utils.bufferToBase64(passwordHash),
    passwordDerivedKeyHash: await cryptolib.sha512(passwordDerivedKey),
    encryptedEncryptionKey: encryptedEncryptionKey,
    encryptedEncryptionKeyIV: iv
  }
  await API.createEncryptedAccount(account)

  const wallet = ethers.Wallet.createRandom()

  const encodedMnemonic = utils._encodeUTF8(wallet.mnemonic.phrase)
  const mnemonicIV = getRandomIV()
  const encryptedMnemonic = await cryptolib.encryptAESCBC(
    encryptionKey,
    mnemonicIV,
    encodedMnemonic
  )

  await API.createEncryptedWallet({
    token,
    passwordHash: utils.bufferToBase64(passwordHash),
    encryptedMnemonic,
    encryptedMnemonicIV: mnemonicIV
  })

  return wallet
}
