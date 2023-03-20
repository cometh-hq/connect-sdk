import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import { ethers } from 'ethers'

import { API } from '../../services/API/API'

export declare class SmartWallet {
  private smartWalletAddress
  private ethProvider
  private ethAdapter
  private safeSdk
  constructor({
    smartWalletAddress,
    ethProvider
  }: {
    smartWalletAddress: string
    ethProvider: ethers.providers.Web3Provider
  })
  init(): Promise<void>
  sendTransaction(
    safeTxData: SafeTransactionDataPartial,
    API: API
  ): Promise<string | null>
}
