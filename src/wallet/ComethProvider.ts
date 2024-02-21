import {
  BaseProvider,
  Network,
  TransactionReceipt,
  TransactionResponse
} from '@ethersproject/providers'

import { DEFAULT_CHAIN_ID } from '../constants'
import { ComethSigner } from './ComethSigner'
import { ComethWallet } from './ComethWallet'
import { UnauthorizedMethodError } from './errors'
import { RelayTransactionResponse } from './RelayTransactionResponse'

export class ComethProvider extends BaseProvider {
  readonly signer: ComethSigner

  constructor(private wallet: ComethWallet) {
    super({
      name: 'Connect Custom Network',
      chainId: wallet.chainId ?? DEFAULT_CHAIN_ID
    })
    this.signer = new ComethSigner(wallet, this)
  }

  getSigner(): ComethSigner {
    return this.signer
  }

  async perform(method: string, params: any): Promise<any> {
    if (method === 'sendTransaction') {
      throw new UnauthorizedMethodError('sendTransaction')
    }
    return await this.wallet.getProvider().perform(method, params)
  }

  async send(method: string, params: any): Promise<any> {
    return await this.wallet.getProvider().send(method, params)
  }

  async getTransaction(safeTxHash: string): Promise<TransactionResponse> {
    return new RelayTransactionResponse(safeTxHash, this, this.wallet)
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
    return this.wallet.getProvider().detectNetwork()
  }

  eth_accounts(): string[] {
    return [this.wallet.getAddress()]
  }
}
