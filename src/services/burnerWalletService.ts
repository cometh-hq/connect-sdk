import { ethers, Wallet } from 'ethers'

import tokenService from '../services/tokenService'

export type ComethConnectStorageData = {
  userId: string
  privateKey: string
}

const getSigner = async (
  token: string,
  walletAddress?: string
): Promise<Wallet> => {
  let signer: Wallet

  const decodedToken = tokenService.decodeToken(token)
  const userId = decodedToken?.payload.sub
  const comethConnectStorageData = window.localStorage.getItem('cometh-connect')

  if (comethConnectStorageData) {
    signer = await _getSignerFromLocalStorage(
      JSON.parse(comethConnectStorageData),
      userId,
      walletAddress
    )
  } else {
    signer = _getNewSigner(userId, walletAddress)
  }
  return signer
}

const _getSignerFromLocalStorage = async (
  comethConnectStorageData: ComethConnectStorageData[],
  userId: string,
  walletAddress?: string
): Promise<Wallet> => {
  if (walletAddress) {
    const signerData = comethConnectStorageData.find(
      (storageData: ComethConnectStorageData) => storageData.userId === userId
    )

    if (!signerData) {
      throw new Error(
        'New Domain detected. You need to add that domain as signer'
      )
    }

    return new ethers.Wallet(signerData.privateKey)
  }

  const newSigner = ethers.Wallet.createRandom()
  comethConnectStorageData.push({
    userId,
    privateKey: newSigner.privateKey
  })

  window.localStorage.setItem(
    'cometh-connect',
    JSON.stringify(comethConnectStorageData)
  )
  return newSigner
}

const _getNewSigner = (userId: string, walletAddress?: string): Wallet => {
  if (walletAddress) {
    throw new Error(
      'New Domain detected. You need to add that domain as signer'
    )
  } else {
    const newSigner = ethers.Wallet.createRandom()
    const comethConnectStorageData = [
      { userId, privateKey: newSigner.privateKey }
    ]
    window.localStorage.setItem(
      'cometh-connect',
      JSON.stringify(comethConnectStorageData)
    )
    return newSigner
  }
}

export default {
  getSigner
}
