import {
  BaseProvider,
  Network,
  TransactionReceipt,
  TransactionResponse
} from '@ethersproject/providers'
import { Signer } from 'ethers'

import { AlembicSigner } from './AlembicSigner'
import { AlembicWallet } from './AlembicWallet'
export declare class AlembicProvider extends BaseProvider {
  private alembicWallet
  readonly signer: AlembicSigner
  constructor(alembicWallet: AlembicWallet)
  getSigner(): Signer
  perform(method: string, params: any): Promise<any>
  send(method: string, params: any): Promise<any>
  getTransaction(transactionHash: string): Promise<TransactionResponse>
  getRelayStatus(transactionHash: string): Promise<any>
  getTransactionReceipt(
    transactionHash: string | Promise<string>
  ): Promise<TransactionReceipt>
  waitForTransaction(
    transactionHash: string,
    confirmations?: number,
    timeout?: number
  ): Promise<TransactionReceipt>
  detectNetwork(): Promise<Network>
}
