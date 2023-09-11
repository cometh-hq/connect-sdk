import { ethers, Wallet } from 'ethers'

import tokenService from '../services/tokenService'

const getSigner = async (
  token: string,
  walletAddress?: string
): Promise<Wallet> => {
  let signer: Wallet

  const decodedToken = tokenService.decodeToken(token)
  const userId = decodedToken?.payload.sub
  const storagePrivateKey = window.localStorage.getItem(
    `cometh-connect-${userId}`
  )

  if (storagePrivateKey) {
    signer = await _getSignerFromLocalStorage(
      storagePrivateKey,
      userId,
      walletAddress
    )
  } else {
    signer = _getNewSigner(userId, walletAddress)
  }
  return signer
}

const _getSignerFromLocalStorage = async (
  storagePrivateKey: string,
  userId: string,
  walletAddress?: string
): Promise<Wallet> => {
  if (walletAddress) {
    return new ethers.Wallet(storagePrivateKey)
  } else {
    const newSigner = ethers.Wallet.createRandom()

    window.localStorage.setItem(
      `cometh-connect-${userId}`,
      newSigner.privateKey
    )
    return newSigner
  }
}

const _getNewSigner = (userId: string, walletAddress?: string): Wallet => {
  console.log(walletAddress)
  if (walletAddress) {
    throw new Error(
      'New Domain detected. You need to add that domain as signer'
    )
  } else {
    const newSigner = ethers.Wallet.createRandom()
    window.localStorage.setItem(
      `cometh-connect-${userId}`,
      newSigner.privateKey
    )
    return newSigner
  }
}

export default {
  getSigner
}
