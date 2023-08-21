import { ethers, Wallet } from 'ethers'

import { Pbkdf2Iterations } from '../constants'
import * as cryptolib from '../services/cryptoService'
import { API } from './API'

function getRandomPrivateKey(): Uint8Array {
  const array = new Uint8Array(32)
  cryptolib.getRandomValues(array)
  return array
}

function getRandomIV(): Uint8Array {
  const array = new Uint8Array(16)
  cryptolib.getRandomValues(array)
  return array
}
function _decodeUTF8(b: ArrayBuffer): string {
  return new TextDecoder().decode(b)
}

function _encodeUTF8(s: string): ArrayBuffer {
  return new TextEncoder().encode(s)
}

function bufferToArrayBuffer(bufferObject): ArrayBuffer {
  const buffer = Buffer.from(bufferObject.data)
  return Uint8Array.from(buffer).buffer
}

export const connectEncryptedWallet = async (
  password: string,
  userId: string,
  token: string,
  API: API
): Promise<Wallet> => {
  const encodedPassword = _encodeUTF8(password)
  const encodedUserId = _encodeUTF8(userId)
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
    await API.getEncryptionKey(token, _decodeUTF8(passwordHash))

  const encryptionKey = await cryptolib.decryptAESCBC(
    passwordDerivedKey,
    bufferToArrayBuffer(encryptedEncryptionKeyIV),
    bufferToArrayBuffer(encryptedEncryptionKey)
  )

  const { encryptedMnemonic, encryptedMnemonicIV } =
    await API.getEncryptedWallet(token, _decodeUTF8(passwordHash))

  const mnemonic = await cryptolib.decryptAESCBC(
    encryptionKey,
    bufferToArrayBuffer(encryptedMnemonicIV),
    bufferToArrayBuffer(encryptedMnemonic)
  )
  const wallet = ethers.Wallet.fromMnemonic(_decodeUTF8(mnemonic))
  return wallet
}

export const createEncryptedWallet = async (
  password: string,
  userId: string,
  token: string,
  API: API
): Promise<Wallet> => {
  const encryptionKey = getRandomPrivateKey()

  const encodedPassword = _encodeUTF8(password)
  const encodedUserId = _encodeUTF8(userId)
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
    passwordHash: _decodeUTF8(passwordHash),
    passwordDerivedKeyHash: await cryptolib.sha512(passwordDerivedKey),
    encryptedEncryptionKey: encryptedEncryptionKey,
    encryptedEncryptionKeyIV: iv
  }
  await API.createEncryptedAccount(account)

  const wallet = ethers.Wallet.createRandom()

  const encodedMnemonic = _encodeUTF8(wallet.mnemonic.phrase)
  const mnemonicIV = getRandomIV()
  const encryptedMnemonic = await cryptolib.encryptAESCBC(
    encryptionKey,
    mnemonicIV,
    encodedMnemonic
  )

  await API.createEncryptedWallet({
    token,
    passwordHash: _decodeUTF8(passwordHash),
    encryptedMnemonic,
    encryptedMnemonicIV: mnemonicIV
  })

  return wallet
}
