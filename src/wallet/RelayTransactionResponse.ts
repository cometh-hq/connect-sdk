import {
  TransactionReceipt,
  TransactionResponse
} from '@ethersproject/abstract-provider'
import { BigNumber } from 'ethers'
import { AccessList } from 'ethers/lib/utils'

import safeService from '../services/safeService'
import { ComethProvider } from './ComethProvider'
import { ComethWallet } from './ComethWallet'

const CATCH_EVENT_MAX_TRIES = 10
const GET_RECEIPT_MAX_TRIES = 10

export class RelayTransactionResponse implements TransactionResponse {
  hash: string
  catch_event_tries: number
  get_receipt_tries: number
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
    this.catch_event_tries = 0
    this.get_receipt_tries = 0
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

  private hasReachedMaxTriesForCatchTxEvent(): boolean {
    return this.catch_event_tries === CATCH_EVENT_MAX_TRIES
  }

  private hasReachedMaxTriesForGetReceiptEvent(): boolean {
    return this.get_receipt_tries === GET_RECEIPT_MAX_TRIES
  }

  public async wait(): Promise<any> {
    if (
      this.hasReachedMaxTriesForCatchTxEvent() ||
      this.hasReachedMaxTriesForGetReceiptEvent()
    )
      return

    let txSuccessEvent: any = undefined
    let txFailureEvent: any = undefined

    while (
      !txSuccessEvent &&
      !txFailureEvent &&
      !this.hasReachedMaxTriesForCatchTxEvent()
    ) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
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
      this.catch_event_tries++
    }

    if (txSuccessEvent) {
      let txResponse: TransactionReceipt | null = null
      while (
        txResponse === null &&
        !this.hasReachedMaxTriesForGetReceiptEvent()
      ) {
        txResponse = await this.provider.getTransactionReceipt(
          txSuccessEvent.transactionHash
        )
        this.get_receipt_tries++
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }

      if (txResponse) {
        this.hash = txResponse.transactionHash
        this.confirmations = txResponse.confirmations
        this.from = txResponse.from
        this.data = txSuccessEvent.data
        this.value = txSuccessEvent.args[1]

        return txResponse
      }
    }
    if (txFailureEvent) {
      let txResponse: TransactionReceipt | null = null
      while (
        txResponse === null &&
        !this.hasReachedMaxTriesForGetReceiptEvent()
      ) {
        txResponse = await this.provider.getTransactionReceipt(
          txFailureEvent.transactionHash
        )
        this.get_receipt_tries++
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
      if (txResponse) {
        this.hash = txResponse.transactionHash
        this.confirmations = txResponse.confirmations
        this.from = txResponse.from
        this.data = txFailureEvent.data
        this.value = txFailureEvent.args[1]

        return txResponse
      }
    }

    return this.wait()
  }
}
