import {
  TransactionReceipt,
  TransactionResponse
} from '@ethersproject/abstract-provider'
import { BigNumber } from 'ethers'
import { AccessList } from 'ethers/lib/utils'

import { AlembicProvider } from './AlembicProvider'
import { AlembicWallet } from './AlembicWallet'
export declare class RelayTransactionResponse implements TransactionResponse {
  private safeTxHash
  private provider
  private alembicWallet
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
    safeTxHash: string,
    provider: AlembicProvider,
    alembicWallet: AlembicWallet
  )
  wait(): Promise<TransactionReceipt>
}
