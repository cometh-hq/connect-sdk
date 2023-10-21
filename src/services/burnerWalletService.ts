import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { ethers, Wallet } from 'ethers'

import { API } from './API'
import safeService from './safeService'

export const _setSignerLocalStorage = (
  identifier: string,
  privateKey: string
): void => {
  window.localStorage.setItem(`cometh-connect-${identifier}`, privateKey)
}

export const _getSignerLocalStorage = (identifier: string): string | null => {
  return window.localStorage.getItem(`cometh-connect-${identifier}`)
}

export const createSigner = async ({
  API,
  walletAddress,
  token,
  userId
}: {
  API: API
  walletAddress?: string
  token?: string
  userId?: string
}): Promise<{ signer: Wallet; walletAddress: string }> => {
  const signer = ethers.Wallet.createRandom()

  // if import external safe wallet
  if (walletAddress) {
    _setSignerLocalStorage(walletAddress, signer.privateKey)
    return { signer, walletAddress }
  }

  // if safe created by cometh wallet SDK
  const predictedWalletAddress = await API.getWalletAddress(signer.address)

  const identifier = userId ? userId : predictedWalletAddress
  _setSignerLocalStorage(identifier, signer.privateKey)

  return { signer, walletAddress: predictedWalletAddress }
}

export const getSigner = async ({
  API,
  provider,
  walletAddress,
  userId
}: {
  API: API
  provider: StaticJsonRpcProvider
  walletAddress: string
  userId?: string
}): Promise<Wallet> => {
  const identifier = userId ? userId : walletAddress
  const storagePrivateKey = _getSignerLocalStorage(identifier)

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

export default {
  createSigner,
  getSigner
}
