import {
  BaseProvider,
  Network,
  TransactionReceipt,
  TransactionResponse
} from '@ethersproject/providers'

import { AlembicSigner } from './AlembicSigner'
import { AlembicWallet } from './AlembicWallet'
export declare class AlembicProvider extends BaseProvider {
  private alembicWallet
  readonly signer: AlembicSigner
  constructor(alembicWallet: AlembicWallet)
  getSigner(): AlembicSigner
  perform(method: string, params: any): Promise<any>
  send(method: string, params: any): Promise<any>
  getTransaction(safeTxHash: string): Promise<TransactionResponse>
  getTransactionReceipt(
    transactionHash: string | Promise<string>
  ): Promise<TransactionReceipt>
  waitForTransaction(
    transactionHash: string,
    confirmations?: number,
    timeout?: number
  ): Promise<TransactionReceipt>
  detectNetwork(): Promise<Network>
  eth_accounts(): string[]
}
