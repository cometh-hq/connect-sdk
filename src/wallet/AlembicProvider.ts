import {
  BaseProvider,
  Network,
  TransactionReceipt,
  TransactionResponse
} from '@ethersproject/providers'

import { DEFAULT_CHAIN_ID } from '../constants'
import { AlembicSigner } from './AlembicSigner'
import { AlembicWallet } from './AlembicWallet'
import { RelayTransactionResponse } from './RelayTransactionResponse'

export class AlembicProvider extends BaseProvider {
  readonly signer: AlembicSigner

  constructor(private alembicWallet: AlembicWallet) {
    super({
      name: 'ERC-4337 Custom Network',
      chainId: alembicWallet.chainId ?? DEFAULT_CHAIN_ID
    })
    this.signer = new AlembicSigner(alembicWallet, this)
  }

  getSigner(): AlembicSigner {
    return this.signer
  }

  async perform(method: string, params: any): Promise<any> {
    if (method === 'sendTransaction') {
      throw new Error('Not authorized method: sendTransaction')
    }
    return await this.alembicWallet.getProvider().perform(method, params)
  }

  async send(method: string, params: any): Promise<any> {
    return await this.alembicWallet.getProvider().send(method, params)
  }

  async getTransaction(safeTxHash: string): Promise<TransactionResponse> {
    return new RelayTransactionResponse(safeTxHash, this, this.alembicWallet)
  }

  async getTransactionReceipt(
    transactionHash: string | Promise<string>
  ): Promise<TransactionReceipt> {
    return super.getTransactionReceipt(transactionHash)
  }

  async waitForTransaction(
    transactionHash: string,
    confirmations?: number,
    timeout?: number
  ): Promise<TransactionReceipt> {
    return super.waitForTransaction(transactionHash, confirmations, timeout)
  }

  async detectNetwork(): Promise<Network> {
    return this.alembicWallet.getProvider().detectNetwork()
  }

  eth_accounts(): string[] {
    return [this.alembicWallet.getAddress()]
  }
}
