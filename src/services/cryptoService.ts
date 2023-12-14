import * as utils from '../utils/utils'

export const getRandomValues = (arr: Uint8Array): Uint8Array => {
  return window.crypto.getRandomValues(arr)
}

export const pbkdf2 = async (
  password: ArrayBuffer,
  salt: ArrayBuffer,
  iterations: number
): Promise<ArrayBuffer> => {
  const key = await window.crypto.subtle.importKey(
    'raw',
    password,
    {
      name: 'PBKDF2'
    } as any /* required to cast because type definition is not up to date */,
    false,
    ['deriveBits']
  )

  return await window.crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: { name: 'sha-256' } },
    key,
    256
  )
}

export const encryptAESCBC = async (
  privateKey: ArrayBuffer,
  iv: ArrayBuffer,
  data: ArrayBuffer
): Promise<ArrayBuffer> => {
  const key = await window.crypto.subtle.importKey(
    'raw',
    new Uint8Array(privateKey),
    {
      name: 'AES-CBC'
    } as any /* required to cast because type definition is not up to date */,
    false,
    ['encrypt']
  )

  return await window.crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, data)
}

export const decryptAESCBC = async (
  privateKey: ArrayBuffer,
  iv: ArrayBuffer,
  data: ArrayBuffer
): Promise<ArrayBuffer> => {
  const key = await window.crypto.subtle.importKey(
    'raw',
    privateKey,
    {
      name: 'AES-CBC'
    } as any /* required to cast because type definition is not up to date */,
    false,
    ['decrypt']
  )

  return await window.crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, data)
}

export const sha512 = async (data: ArrayBuffer): Promise<ArrayBuffer> => {
  return await window.crypto.subtle.digest('SHA-512', data)
}

export const getRandomIV = (): Uint8Array => {
  const array = new Uint8Array(16)
  getRandomValues(array)
  return array
}

export const encodeWalletAddressToUTF8 = (
  walletAddress: string
): ArrayBuffer => {
  return utils.encodeUTF8(walletAddress)
}

export const encodeSaltToUTF8 = (salt: string): ArrayBuffer => {
  return utils.encodeUTF8(salt)
}

export const encodePrivateKeyToUTF8 = (privateKey: string): ArrayBuffer => {
  return utils.encodeUTF8(privateKey)
}

export const decodePrivateKeyFromUTF8 = (privateKey: ArrayBuffer): string => {
  return utils.decodeUTF8(privateKey)
}
