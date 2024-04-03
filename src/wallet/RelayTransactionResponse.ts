import {
  TransactionReceipt,
  TransactionResponse
} from '@ethersproject/abstract-provider'
import { BigNumber } from 'ethers'
import { AccessList } from 'ethers/lib/utils'

import { DEFAULT_CONFIRMATION_TIME } from '../constants'
import {
  ExecutionFailureEvent,
  ExecutionSuccessEvent
} from '../contracts/types/Safe'
import safeService from '../services/safeService'
import { ComethProvider } from './ComethProvider'
import { ComethWallet } from './ComethWallet'
import {
  RelayedTransactionError,
  RelayedTransactionPendingError
} from './errors'

export class RelayTransactionResponse implements TransactionResponse {
  hash: string
  timeout: number
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
    private relayId: string | undefined,
    private provider: ComethProvider,
    private wallet: ComethWallet
  ) {
    this.hash = '0x0000000000000000000000000000000000000000'
    this.timeout = wallet.transactionTimeout || DEFAULT_CONFIRMATION_TIME
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

  public async wait(): Promise<TransactionReceipt> {
    const startDate = Date.now()
    const timeoutLimit = new Date(startDate + this.timeout).getTime()

    let txSuccessEvent: ExecutionSuccessEvent | undefined = undefined
    let txFailureEvent: ExecutionFailureEvent | undefined = undefined

    while (!txSuccessEvent && !txFailureEvent && Date.now() < timeoutLimit) {
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

    const getTransactionReceipt = async (
      transactionHash: string
    ): Promise<TransactionReceipt> => {
      let txResponse: TransactionReceipt | null = null
      while (txResponse === null) {
        txResponse = await this.provider.getTransactionReceipt(transactionHash)
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
      return txResponse
    }

    if (txSuccessEvent) {
      const txResponse = await getTransactionReceipt(
        txSuccessEvent.transactionHash
      )

      this.hash = txResponse.transactionHash
      this.confirmations = txResponse.confirmations
      this.from = txResponse.from
      this.data = txSuccessEvent.data
      this.value = txSuccessEvent.args[1]

      return txResponse
    }
    if (txFailureEvent) {
      const txResponse = await getTransactionReceipt(
        txFailureEvent.transactionHash
      )

      this.hash = txResponse.transactionHash
      this.confirmations = txResponse.confirmations
      this.from = txResponse.from
      this.data = txFailureEvent.data
      this.value = txFailureEvent.args[1]

      return txResponse
    }

    if (this.relayId) {
      const relayedTransaction = await this.wallet.getRelayedTransaction(
        this.relayId
      )
      if (relayedTransaction.status.confirmed) {
        const txResponse = await getTransactionReceipt(
          relayedTransaction.status.confirmed.hash
        )
        this.hash = txResponse.transactionHash
        this.confirmations = txResponse.confirmations
        this.from = txResponse.from
        return txResponse
      }
      throw new RelayedTransactionPendingError(this.relayId)
    }
    throw new RelayedTransactionError()
  }
}
