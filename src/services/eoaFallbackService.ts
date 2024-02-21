import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from 'ethers'

import { defaultEncryptionSalt, Pbkdf2Iterations } from '../constants'
import * as cryptolib from '../services/cryptoService'
import * as utils from '../utils/utils'
import { NoFallbackSignerError, SignerNotOwnerError } from '../wallet/errors'
import { fallbackStorageValues } from '../wallet/types'
import { API } from './API'
import { getRandomIV } from './randomIvService'
import safeService from './safeService'

export const setSignerLocalStorage = async (
  walletAddress: string,
  signer: Wallet,
  salt?: string
): Promise<void> => {
  const { encryptedPrivateKey, iv } = await encryptEoaFallback(
    walletAddress,
    signer.privateKey,
    salt || defaultEncryptionSalt
  )

  const storageValue = formatStorageValue(
    encryptedPrivateKey,
    iv,
    signer.address
  )

  window.localStorage.setItem(
    `cometh-connect-fallback-${walletAddress}`,
    storageValue
  )
}

export const getSignerLocalStorage = async (
  walletAddress: string,
  salt?: string
): Promise<Wallet | null> => {
  const localStorageV1 = window.localStorage.getItem(
    `cometh-connect-${walletAddress}`
  )

  const localStorageV2 = window.localStorage.getItem(
    `cometh-connect-fallback-${walletAddress}`
  )

  if (localStorageV1) {
    const privateKey = localStorageV1
    const signer = new Wallet(privateKey)

    await setSignerLocalStorage(walletAddress, signer, salt)
    window.localStorage.removeItem(`cometh-connect-${walletAddress}`)

    return signer
  }

  if (localStorageV2) {
    const { encryptedPrivateKey, iv } = unFormatStorageValue(localStorageV2)

    const privateKey = await decryptEoaFallback(
      walletAddress,
      utils.base64ToArrayBuffer(encryptedPrivateKey),
      utils.base64toUint8Array(iv),
      salt || defaultEncryptionSalt
    )

    const signer = new Wallet(privateKey)

    return signer
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
  const signer = Wallet.createRandom()

  // if import external safe wallet
  if (walletAddress) {
    await setSignerLocalStorage(walletAddress, signer, encryptionSalt)
    return { signer, walletAddress }
  }

  // if safe created by cometh wallet SDK
  const predictedWalletAddress = await API.getWalletAddress(signer.address)

  await setSignerLocalStorage(predictedWalletAddress, signer, encryptionSalt)

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
  const signer = await getSignerLocalStorage(walletAddress, encryptionSalt)

  if (!signer) throw new NoFallbackSignerError()

  const isOwner = await safeService.isSigner(
    signer.address,
    walletAddress,
    provider,
    API
  )

  if (!isOwner) throw new SignerNotOwnerError()

  return signer
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
  iv: string,
  signerAddress: string
): string => {
  return JSON.stringify({
    encryptedPrivateKey,
    iv,
    signerAddress
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
  unFormatStorageValue,
  getSignerLocalStorage,
  setSignerLocalStorage
}
