import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { ethers, Wallet } from 'ethers'

import { defaultEncryptionSalt, Pbkdf2Iterations } from '../constants'
import * as cryptolib from '../services/cryptoService'
import * as utils from '../utils/utils'
import { fallbackStorageValues } from '../wallet/types'
import { API } from './API'
import { getRandomIV } from './randomIvService'
import safeService from './safeService'

export const _setSignerLocalStorage = async (
  walletAddress: string,
  privateKey: string,
  salt?: string
): Promise<void> => {
  const { encryptedPrivateKey, iv } = await encryptEoaFallback(
    walletAddress,
    privateKey,
    salt || defaultEncryptionSalt
  )

  const storageValue = formatStorageValue(encryptedPrivateKey, iv)

  window.localStorage.setItem(
    `cometh-connect-fallback-${walletAddress}`,
    storageValue
  )
}

export const _getSignerLocalStorage = async (
  walletAddress: string,
  salt?: string
): Promise<string | null> => {
  const localStorageV1 = window.localStorage.getItem(
    `cometh-connect-${walletAddress}`
  )

  const localStorageV2 = window.localStorage.getItem(
    `cometh-connect-fallback-${walletAddress}`
  )

  if (localStorageV1) {
    const privatekey = localStorageV1

    await _setSignerLocalStorage(walletAddress, privatekey, salt)
    window.localStorage.removeItem(`cometh-connect-${walletAddress}`)

    return privatekey
  }

  if (localStorageV2) {
    const { encryptedPrivateKey, iv } = unFormatStorageValue(localStorageV2)

    const privateKey = await decryptEoaFallback(
      walletAddress,
      utils.base64ToArrayBuffer(encryptedPrivateKey),
      utils.base64toUint8Array(iv),
      salt || defaultEncryptionSalt
    )

    return privateKey
  }

  return null
}

export const createSigner = async ({
  API,
  encryptionSalt,
  walletAddress
}: {
  API: API
  encryptionSalt?: string
  walletAddress?: string
}): Promise<{ signer: Wallet; walletAddress: string }> => {
  const signer = ethers.Wallet.createRandom()

  // if import external safe wallet
  if (walletAddress) {
    await _setSignerLocalStorage(
      walletAddress,
      signer.privateKey,
      encryptionSalt
    )
    return { signer, walletAddress }
  }

  // if safe created by cometh wallet SDK
  const predictedWalletAddress = await API.getWalletAddress(signer.address)

  await _setSignerLocalStorage(
    predictedWalletAddress,
    signer.privateKey,
    encryptionSalt
  )

  return { signer, walletAddress: predictedWalletAddress }
}

export const getSigner = async ({
  API,
  provider,
  walletAddress,
  encryptionSalt
}: {
  API: API
  provider: StaticJsonRpcProvider
  walletAddress: string
  encryptionSalt?: string
}): Promise<Wallet> => {
  const storagePrivateKey = await _getSignerLocalStorage(
    walletAddress,
    encryptionSalt
  )

  if (!storagePrivateKey)
    throw new Error(
      'New Domain detected. You need to add that domain as signer.'
    )

  const storageSigner = new ethers.Wallet(storagePrivateKey)

  const isOwner = await safeService.isSigner(
    storageSigner.address,
    walletAddress,
    provider,
    API
  )

  if (!isOwner)
    throw new Error(
      'New Domain detected. You need to add that domain as signer.'
    )

  return storageSigner
}

const encryptEoaFallback = async (
  walletAddress: string,
  privateKey: string,
  salt: string
): Promise<{ encryptedPrivateKey: string; iv: string }> => {
  const encodedWalletAddress = utils.encodeUTF8(walletAddress)
  const encodedSalt = utils.encodeUTF8(salt)

  const encryptionKey = await cryptolib.pbkdf2(
    encodedWalletAddress,
    encodedSalt,
    Pbkdf2Iterations
  )

  const encodedPrivateKey = utils.encodeUTF8(privateKey)

  const iv = getRandomIV()

  const encryptedPrivateKey = await cryptolib.encryptAESCBC(
    encryptionKey,
    iv,
    encodedPrivateKey
  )

  return {
    encryptedPrivateKey: utils.arrayBufferToBase64(encryptedPrivateKey),
    iv: utils.uint8ArrayToBase64(iv)
  }
}

const decryptEoaFallback = async (
  walletAddress: string,
  encryptedPrivateKey: ArrayBuffer,
  iv: ArrayBuffer,
  salt: string
): Promise<string> => {
  const encodedWalletAddress = utils.encodeUTF8(walletAddress)
  const encodedSalt = utils.encodeUTF8(salt)

  const encryptionKey = await cryptolib.pbkdf2(
    encodedWalletAddress,
    encodedSalt,
    Pbkdf2Iterations
  )

  const privateKey = await cryptolib.decryptAESCBC(
    encryptionKey,
    iv,
    encryptedPrivateKey
  )

  return utils.decodeUTF8(privateKey)
}

const formatStorageValue = (
  encryptedPrivateKey: string,
  iv: string
): string => {
  return JSON.stringify({
    encryptedPrivateKey,
    iv
  })
}

const unFormatStorageValue = (storageValue: string): fallbackStorageValues => {
  return JSON.parse(storageValue)
}

export default {
  createSigner,
  getSigner,
  encryptEoaFallback,
  decryptEoaFallback,
  formatStorageValue,
  unFormatStorageValue
}
