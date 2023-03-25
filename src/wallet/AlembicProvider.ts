import {
  BaseProvider,
  Network,
  TransactionReceipt,
  TransactionResponse
} from '@ethersproject/providers'
import { Signer } from 'ethers'
import { TransactionStatus } from 'src/wallet/types'

import { AlembicSigner } from './AlembicSigner'
import { AlembicWallet } from './AlembicWallet'
import { RelayTransactionResponse } from './RelayTransactionResponse'

export class AlembicProvider extends BaseProvider {
  readonly signer: AlembicSigner

  constructor(private alembicWallet: AlembicWallet) {
    super({
      name: 'ERC-4337 Custom Network',
      chainId: 137
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

  async getTransaction(
    transactionHash: string | Promise<string>
  ): Promise<TransactionResponse> {
    const status = await this.getRelayStatus(await transactionHash)
    const txResponse = await super.getTransaction(status.hash)

    return new RelayTransactionResponse(txResponse, await transactionHash, this)
  }

  async getRelayStatus(relayId: string): Promise<TransactionStatus> {
    return this.alembicWallet.getRelayTxStatus(relayId)
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
