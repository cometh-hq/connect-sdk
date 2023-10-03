import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { ethers, Wallet } from 'ethers'

import { API } from './API'
import safeService from './safeService'

export const createSignerAndWallet = async (API: API): Promise<Wallet> => {
  const newSigner = ethers.Wallet.createRandom()
  const walletAddress = await API.initWallet({
    ownerAddress: newSigner.address
  })
  window.localStorage.setItem(
    `cometh-connect-${walletAddress}`,
    newSigner.privateKey
  )

  return newSigner
}

export const createSignerAndWalletByToken = async (
  token: string,
  userId: string,
  API: API
): Promise<Wallet> => {
  const newSigner = ethers.Wallet.createRandom()
  window.localStorage.setItem(`cometh-connect-${userId}`, newSigner.privateKey)

  await API.initWalletForUserID({
    token,
    ownerAddress: newSigner.address
  })

  return newSigner
}

export const getSigner = async (
  API: API,
  provider: StaticJsonRpcProvider,
  walletAddress: string
): Promise<Wallet> => {
  const storagePrivateKey = window.localStorage.getItem(
    `cometh-connect-${walletAddress}`
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

export const getSignerByToken = async (
  userId: string,
  API: API,
  provider: StaticJsonRpcProvider,
  walletAddress: string
): Promise<Wallet> => {
  const storagePrivateKey = window.localStorage.getItem(
    `cometh-connect-${userId}`
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

export default {
  createSignerAndWallet,
  createSignerAndWalletByToken,
  getSigner,
  getSignerByToken
}
