import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { ethers, Wallet } from 'ethers'

import { API } from './API'
import safeService from './safeService'

export type ComethConnectStorageData = {
  privateKey: string
}

const getSigner = async (
  provider: StaticJsonRpcProvider,
  API: API,
  walletAddress?: string
): Promise<Wallet> => {
  let signer: Wallet

  const comethConnectStorageData = window.localStorage.getItem('cometh-connect')

  if (comethConnectStorageData) {
    signer = await _getSignerFromLocalStorage(
      JSON.parse(comethConnectStorageData),
      provider,
      API,
      walletAddress
    )
  } else {
    signer = _getNewSigner(walletAddress)
  }
  return signer
}

const _getSignerFromLocalStorage = async (
  comethConnectStorageData: ComethConnectStorageData[],
  provider: StaticJsonRpcProvider,
  API: API,
  walletAddress?: string
): Promise<Wallet> => {
  if (walletAddress) {
    const filteredStorageSigner = comethConnectStorageData.find(
      async (storageSigner: ComethConnectStorageData) =>
        (await safeService.isSigner(
          new ethers.Wallet(storageSigner.privateKey).address,
          walletAddress,
          provider,
          API
        )) === true
    )

    if (!filteredStorageSigner) {
      throw new Error(
        'New Domain detected. You need to add that domain as signer'
      )
    }

    return new ethers.Wallet(filteredStorageSigner.privateKey)
  }

  const newSigner = ethers.Wallet.createRandom()
  comethConnectStorageData.push({
    privateKey: newSigner.privateKey
  })

  window.localStorage.setItem(
    'cometh-connect',
    JSON.stringify(comethConnectStorageData)
  )
  return newSigner
}

const _getNewSigner = (walletAddress?: string): Wallet => {
  if (walletAddress) {
    throw new Error(
      'New Domain detected. You need to add that domain as signer'
    )
  } else {
    const newSigner = ethers.Wallet.createRandom()
    const comethConnectStorageData = [{ privateKey: newSigner.privateKey }]
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
