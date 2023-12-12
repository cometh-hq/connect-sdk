import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { ethers, Wallet } from 'ethers'

import { API } from './API'
import safeService from './safeService'

export const _setSignerLocalStorage = (
  walletAddress: string,
  privateKey: string
): void => {
  window.localStorage.setItem(`cometh-connect-${walletAddress}`, privateKey)
}

export const _getSignerLocalStorage = (
  walletAddress: string
): string | null => {
  return window.localStorage.getItem(`cometh-connect-${walletAddress}`)
}

export const createSigner = async ({
  API,
  walletAddress
}: {
  API: API
  walletAddress?: string
}): Promise<{ signer: Wallet; walletAddress: string }> => {
  const signer = ethers.Wallet.createRandom()

  // if import external safe wallet
  if (walletAddress) {
    _setSignerLocalStorage(walletAddress, signer.privateKey)
    return { signer, walletAddress }
  }

  // if safe created by cometh wallet SDK
  const predictedWalletAddress = await API.getWalletAddress(signer.address)

  _setSignerLocalStorage(predictedWalletAddress, signer.privateKey)

  return { signer, walletAddress: predictedWalletAddress }
}

export const getSigner = async ({
  API,
  provider,
  walletAddress
}: {
  API: API
  provider: StaticJsonRpcProvider
  walletAddress: string
}): Promise<Wallet> => {
  const storagePrivateKey = _getSignerLocalStorage(walletAddress)

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
