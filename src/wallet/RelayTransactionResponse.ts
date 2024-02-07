import {
  TransactionReceipt,
  TransactionResponse
} from '@ethersproject/abstract-provider'
import { BigNumber } from 'ethers'
import { AccessList } from 'ethers/lib/utils'

import { DEFAULT_CONFIRMATION_TIME } from '../constants'
import safeService from '../services/safeService'
import { ComethProvider } from './ComethProvider'
import { ComethWallet } from './ComethWallet'

export class RelayTransactionResponse implements TransactionResponse {
  hash: string
  blockNumber?: number
  blockHash?: string
  timestamp?: number
  confirmations: number
  from: string
  raw?: string
  to?: string
  nonce: number
  gasLimit: BigNumber
  gasPrice?: BigNumber
  data: string
  value: BigNumber
  chainId: number
  r?: string
  s?: string
  v?: number
  type?: number | null
  accessList?: AccessList
  maxPriorityFeePerGas?: BigNumber
  maxFeePerGas?: BigNumber

  constructor(
    private safeTxHash: string,
    private provider: ComethProvider,
    private wallet: ComethWallet
  ) {
    this.hash = '0x0000000000000000000000000000000000000000'
    this.confirmations = 0
    this.from = this.wallet.getAddress()
    this.nonce = 0
    this.gasLimit = BigNumber.from(0)
    this.value = BigNumber.from(0)
    this.data = '0x0'
    this.chainId = 0
  }

  public getSafeTxHash(): string {
    return this.safeTxHash
  }

  public async wait(confirmations?: number): Promise<any> {
    const timeout = confirmations || DEFAULT_CONFIRMATION_TIME
    const startDate = Date.now()

    let txSuccessEvent: any = undefined
    let txFailureEvent: any = undefined

    while (
      !txSuccessEvent &&
      !txFailureEvent &&
      new Date(Date.now()) < new Date(startDate + timeout)
    ) {
      await new Promise((resolve) => setTimeout(resolve, 3000))
      txSuccessEvent = await safeService.getSuccessExecTransactionEvent(
        this.safeTxHash,
        this.from,
        this.provider
      )
      txFailureEvent = await safeService.getFailedExecTransactionEvent(
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

        await new Promise((resolve) => setTimeout(resolve, 2000))
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

        await new Promise((resolve) => setTimeout(resolve, 2000))
      }

      this.hash = txResponse.transactionHash
      this.confirmations = txResponse.confirmations
      this.from = txResponse.from
      this.data = txFailureEvent.data
      this.value = txFailureEvent.args[1]

      return txResponse
    }
  }
}
