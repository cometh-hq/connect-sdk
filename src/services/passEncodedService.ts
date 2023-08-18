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

  const encryptedEncryptionKey = await API.getEncryptionKey(token, passwordHash)

  const encryptionKey = await cryptolib.decryptAESCBC(
    passwordDerivedKey,
    encryptedEncryptionKey.iv,
    encryptedEncryptionKey.data
  )

  const encryptedWallets = await API.getEncryptedWallet(token, passwordHash)
  if (encryptedWallets.length !== 1) {
    throw new Error(
      `account needs exactly one encrypted wallet, but has ${encryptedWallets.length}`
    )
  }

  const mnemonic = await cryptolib.decryptAESCBC(
    encryptionKey,
    encryptedWallets[0].encryptedMnemonicIV,
    encryptedWallets[0].encryptedMnemonic
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
    passwordHash,
    passwordDerivedKeyHash: await cryptolib.sha512(passwordDerivedKey),
    encryptedEncryptionKey,
    encryptedEncryptionKeyIV: iv
  }
  await API.createEncryptedAccount(account)

  const wallet = ethers.Wallet.createRandom()

  const encodedMnemonic = _encodeUTF8(wallet.mnemonic.toString())
  const mnemonicIV = getRandomIV()
  const encryptedMnemonic = await cryptolib.encryptAESCBC(
    encryptionKey,
    mnemonicIV,
    encodedMnemonic
  )

  await API.createEncryptedWallet({
    token,
    passwordHash,
    encryptedMnemonic,
    encryptedMnemonicIV: mnemonicIV
  })

  return wallet
}
