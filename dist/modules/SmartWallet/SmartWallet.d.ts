import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import { ethers } from 'ethers'

export interface SmartWalletConfig {
  smartWalletAddress: string
  ethProvider: ethers.providers.Web3Provider
  apiKey: string
}
export declare class SmartWallet {
  private smartWalletAddress
  private ethProvider
  private ethAdapter
  private safeSdk
  private API
  constructor({ smartWalletAddress, ethProvider, apiKey }: SmartWalletConfig)
  init(): Promise<void>
  sendTransaction(
    safeTxData: SafeTransactionDataPartial
  ): Promise<string | null>
}
