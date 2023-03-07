import Safe from '@safe-global/safe-core-sdk'
import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import EthersAdapter from '@safe-global/safe-ethers-lib'
import ethers from 'ethers'

import { EthProvider, SmartWalletAddress } from '../../types'
import { SmartWallet as SmartWalletType } from '../types'

export class SmartWallet implements SmartWalletType {
  private smartWalletAddress: SmartWalletAddress
  private ethProvider: EthProvider
  private ethAdapter: EthersAdapter
  private safeSdk: Safe | null = null

  constructor({
    smartWalletAddress,
    ethProvider
  }: {
    smartWalletAddress: SmartWalletAddress
    ethProvider: EthProvider
  }) {
    this.smartWalletAddress = smartWalletAddress
    this.ethProvider = ethProvider
    this.ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: this.ethProvider.getSigner()
    })
  }

  async init(): Promise<void> {
    if (!this.ethAdapter) throw new Error('No EOA adapter found')
    if (!this.ethProvider) throw new Error('No ethProvider set')
    if (!this.smartWalletAddress) throw new Error('No smartWalletAddress set')

    const safeSdk: Safe = await Safe.create({
      ethAdapter: this.ethAdapter,
      safeAddress: this.smartWalletAddress
    })

    if (safeSdk) {
      this.safeSdk = safeSdk
    }
  }

  async sendTransaction({
    to,
    value,
    data
  }: SafeTransactionDataPartial): Promise<void> {
    if (!this.safeSdk) throw new Error('No Safe SDK found')

    const safeTransaction = await this.safeSdk?.createTransaction({
      safeTransactionData: {
        to,
        value,
        data
      }
    })
    const signature = await this.safeSdk.signTypedData(safeTransaction)
  }
}
