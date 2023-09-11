import { ethers, Wallet } from 'ethers'

import tokenService from '../services/tokenService'

const getSigner = async (
  token: string,
  walletAddress?: string
): Promise<Wallet | undefined> => {
  let signer: Wallet | undefined

  const decodedToken = tokenService.decodeToken(token)
  const userId = decodedToken?.payload.sub
  if (!userId) throw new Error('No userId found')

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

const _getNewSigner = (
  userId: string,
  walletAddress?: string
): Wallet | undefined => {
  if (walletAddress) {
    return
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
