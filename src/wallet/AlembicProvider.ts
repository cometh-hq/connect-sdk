import {
  BaseProvider,
  Network,
  TransactionReceipt,
  TransactionResponse
} from '@ethersproject/providers'
import { Signer } from 'ethers'

import { DEFAULT_CHAIN_ID } from '../constants'
import { TransactionStatus } from '../wallet/types'
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

  getSigner(): Signer {
    return this.signer
  }

  async perform(method: string, params: any): Promise<any> {
    if (method === 'sendTransaction') {
      throw new Error('Not authorized method: sendTransaction')
    }
    return await this.alembicWallet.getOwnerProvider().perform(method, params)
  }

  async send(method: string, params: any): Promise<any> {
    return await this.alembicWallet.getOwnerProvider().send(method, params)
  }

  async getTransaction(
    encodedTransactionHash: string
  ): Promise<TransactionResponse> {
    const txEvent = await this.wait(encodedTransactionHash)
    const txResponse = await super.getTransaction(txEvent.transactionHash)

    return new RelayTransactionResponse(txResponse, this)
  }

  public async wait(transactionHash: string): Promise<TransactionReceipt> {
    const txEvent = await this.alembicWallet.getExecTransactionEvent(
      transactionHash
    )

    if (txEvent.length > 0) {
      return txEvent[0]
    }
    await new Promise((resolve) => setTimeout(resolve, 2000))
    return this.wait(transactionHash)
  }

  async getRelayStatus(transactionHash: string): Promise<TransactionStatus> {
    return await this.alembicWallet.getRelayTxStatus(transactionHash)
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
    return this.alembicWallet.getOwnerProvider().detectNetwork()
  }
}
