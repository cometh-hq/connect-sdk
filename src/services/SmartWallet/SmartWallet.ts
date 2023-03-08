import Safe from '@safe-global/safe-core-sdk'
import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import EthersAdapter from '@safe-global/safe-ethers-lib'
import { ethers } from 'ethers'

import { API } from '../API/API'

export class SmartWallet {
  private smartWalletAddress: string
  private ethProvider: ethers.providers.Web3Provider
  private ethAdapter: EthersAdapter
  private safeSdk: Safe | null = null

  constructor({
    smartWalletAddress,
    ethProvider
  }: {
    smartWalletAddress: string
    ethProvider: ethers.providers.Web3Provider
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

  async sendTransaction(safeTxData: SafeTransactionDataPartial): Promise<void> {
    if (!this.safeSdk) throw new Error('No Safe SDK found')

    const safeTxDataTyped = {
      to: safeTxData.to,
      value: safeTxData.value,
      data: safeTxData.data,
      operation: safeTxData.operation ?? 0,
      safeTxGas: safeTxData.safeTxGas ?? 0,
      baseGas: safeTxData.baseGas ?? 0,
      gasPrice: safeTxData.gasPrice ?? 0,
      gasToken: safeTxData.gasToken ?? ethers.constants.AddressZero,
      refundReceiver: safeTxData.refundReceiver ?? ethers.constants.AddressZero
    }

    const safeTransaction = await this.safeSdk.createTransaction({
      safeTransactionData: safeTxDataTyped
    })
    const signature = await this.safeSdk.signTypedData(safeTransaction)

    const relayId = await API.relayTransaction({
      safeTxData: safeTxDataTyped,
      signatures: signature.data,
      smartWalletAddress: this.smartWalletAddress
    })
  }
}
