import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { ethers, Wallet } from 'ethers'

import { API } from './API'
import safeService from './safeService'

export const createOrGetSigner = async (
  token: string,
  userId: string,
  walletAddress: string,
  API: API,
  provider: StaticJsonRpcProvider
): Promise<Wallet> => {
  if (!userId) throw new Error('No userId found')

  const storagePrivateKey = window.localStorage.getItem(
    `cometh-connect-${userId}`
  )

  if (!walletAddress) {
    const newSigner = ethers.Wallet.createRandom()
    window.localStorage.setItem(
      `cometh-connect-${userId}`,
      newSigner.privateKey
    )

    await API.initWalletForUserID({
      token,
      ownerAddress: newSigner.address
    })

    return newSigner
  } else {
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
}

export default {
  createOrGetSigner
}
