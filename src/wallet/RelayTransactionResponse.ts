import {
  TransactionReceipt,
  TransactionResponse
} from '@ethersproject/abstract-provider'
import { BigNumber } from 'ethers'
import { AccessList } from 'ethers/lib/utils'

import { AlembicProvider } from './AlembicProvider'
import { AlembicWallet } from './AlembicWallet'
import SafeUtils from './SafeUtils'

export class RelayTransactionResponse implements TransactionResponse {
  hash: string
  blockNumber?: number | undefined
  blockHash?: string | undefined
  timestamp?: number | undefined
  confirmations: number
  from: string
  raw?: string | undefined
  to?: string | undefined
  nonce: number
  gasLimit: BigNumber
  gasPrice?: BigNumber | undefined
  data: string
  value: BigNumber
  chainId: number
  r?: string | undefined
  s?: string | undefined
  v?: number | undefined
  type?: number | null | undefined
  accessList?: AccessList | undefined
  maxPriorityFeePerGas?: BigNumber | undefined
  maxFeePerGas?: BigNumber | undefined

  constructor(
    private safeTxHash: string,
    private provider: AlembicProvider,
    private alembicWallet: AlembicWallet
  ) {
    this.hash = '0x0'
    this.confirmations = 0
    this.from = this.alembicWallet.getAddress()
    this.nonce = 0
    this.gasLimit = BigNumber.from(0)
    this.value = BigNumber.from(0)
    this.data = '0x0'
    this.chainId = 0
  }

  public getSafeTxHash(): string {
    return this.safeTxHash
  }

  public async wait(): Promise<TransactionReceipt> {
    let txSuccessEvent: any = undefined
    let txFailureEvent: any = undefined

    while (!txSuccessEvent && !txFailureEvent) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      txSuccessEvent = await SafeUtils.getSuccessExecTransactionEvent(
        this.safeTxHash,
        this.from,
        this.provider
      )
      txFailureEvent = await SafeUtils.getFailedExecTransactionEvent(
        this.safeTxHash,
        this.from,
        this.provider
      )
    }

    if (txSuccessEvent) {
      let txResponse: TransactionReceipt | null = null
      while (txResponse === null) {
        txResponse = await this.provider.getTransactionReceipt(
          txSuccessEvent.transactionHash
        )
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      this.hash = txResponse.transactionHash
      this.confirmations = txResponse.confirmations
      this.from = txResponse.from
      this.data = txSuccessEvent.data
      this.value = txSuccessEvent.args[1]

      return txResponse
    }
    if (txFailureEvent) {
      let txResponse: TransactionReceipt | null = null
      while (txResponse === null) {
        txResponse = await this.provider.getTransactionReceipt(
          txFailureEvent.transactionHash
        )
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
      this.hash = txResponse.transactionHash
      this.confirmations = txResponse.confirmations
      this.from = txResponse.from
      this.data = txFailureEvent.data
      this.value = txFailureEvent.args[1]

      return txResponse
    }

    await new Promise((resolve) => setTimeout(resolve, 2000))
    return this.wait()
  }
}
