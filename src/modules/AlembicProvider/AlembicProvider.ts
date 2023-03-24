import {
  BaseProvider,
  Network,
  TransactionReceipt,
  TransactionResponse,
  Web3Provider
} from '@ethersproject/providers'
import { Signer } from 'ethers'
import { TransactionStatus } from 'src/types'

import { AlembicWallet } from '../AlembicWallet'
import { AlembicSigner } from './AlembicSigner'
import { RelayTransactionResponse } from './RelayTransactionResponse'

export class AlembicProvider extends BaseProvider {
  initializedBlockNumber!: number

  readonly signer: AlembicSigner

  constructor(
    private ethProvider: Web3Provider,
    private alembicWallet: AlembicWallet
  ) {
    super({
      name: 'ERC-4337 Custom Network',
      chainId: 137
    })

    this.signer = new AlembicSigner(alembicWallet, this)
  }

  /**
   * finish intializing the provider.
   * MUST be called after construction, before using the provider.
   */
  async init(): Promise<this> {
    // await this.httpRpcClient.validateChainId()
    this.initializedBlockNumber = await this.ethProvider.getBlockNumber()

    return this
  }

  getSigner(): Signer {
    return this.signer
  }

  async perform(method: string, params: any): Promise<any> {
    console.log('perform', method, params)
    if (method === 'sendTransaction') {
      // TODO: do we need 'perform' method to be available at all?
      // there is nobody out there to use it for ERC-4337 methods yet, we have nothing to override in fact.
      throw new Error('Should not get here. Investigate.')
    }
    return await this.ethProvider.perform(method, params)
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
    console.log('getTransactionReceipt', transactionHash)
    return super.getTransactionReceipt(transactionHash)
  }

  async waitForTransaction(
    transactionHash: string,
    confirmations?: number,
    timeout?: number
  ): Promise<TransactionReceipt> {
    console.log('waitForTransaction', transactionHash, confirmations, timeout)
    return super.waitForTransaction(transactionHash, confirmations, timeout)
  }

  async detectNetwork(): Promise<Network> {
    return (this.ethProvider as any).detectNetwork()
  }
}
