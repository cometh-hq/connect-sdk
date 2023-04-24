import {
  TransactionReceipt,
  TransactionResponse
} from '@ethersproject/abstract-provider'
import { BigNumber } from 'ethers'
import { AccessList } from 'ethers/lib/utils'

import { AlembicProvider } from './AlembicProvider'

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

  constructor(tx: TransactionResponse, private provider: AlembicProvider) {
    this.hash = tx.hash
    this.confirmations = tx.confirmations
    this.from = tx.from
    this.nonce = tx.nonce
    this.gasLimit = tx.gasLimit
    this.value = tx.value
    this.data = tx.data
    this.chainId = tx.chainId
  }

  public async wait(): Promise<TransactionReceipt> {
    return this.provider.getTransactionReceipt(this.hash)
  }
}
