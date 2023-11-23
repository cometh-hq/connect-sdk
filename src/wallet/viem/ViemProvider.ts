import { deepHexlify } from '@alchemy/aa-core'
import { MetaTransaction } from 'ethers-multisend'
import { Client, createPublicClient, Hash, http } from 'viem'
import { polygon } from 'viem/chains'

import { ComethWallet } from '../ComethWallet'

/*
function _isSupportedNetwork(value: string): value is SupportedNetworks {
  return Object.values(SupportedNetworks).includes(value as any)
}
  if (!_isSupportedNetwork(chainId)) {
    throw new Error('This network is not supported')
  }  */

export class ViemProvider {
  private wallet: ComethWallet
  private rpcClient: Client

  constructor(wallet: ComethWallet, rpc?: string) {
    this.wallet = wallet
    this.rpcClient = createPublicClient({
      chain: polygon,
      transport: http('https://polygon-rpc.com')
    })
  }

  request: (args: { method: any; params?: any[] }) => Promise<any> = async (
    args
  ) => {
    const { method, params } = args

    switch (method) {
      case 'eth_sendTransaction':
        /* eslint-disable */
        const txParams = deepHexlify(params)
        const result = await this.wallet.sendTransaction(deepHexlify(txParams))
        return result.safeTxHash as Hash
      /* eslint-disable */
      case 'eth_sign':
        const [address, data] = params!
        return this.wallet.signMessage(data)
      case 'eth_chainId':
        return this.wallet.chainId
      default:
        /* eslint-disable */
        /* @ts-ignore */
        return this.rpcClient.request(args)
    }
  }

  public sendTransaction = async (
    safeTxData: MetaTransaction
  ): Promise<Hash> => {
    const result = await this.wallet.sendTransaction(deepHexlify(safeTxData))
    return result.safeTxHash as Hash
  }

  /*  async getTransaction(safeTxHash: string): Promise<TransactionResponse> {
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
    return this.rpcClient.waitForTransaction(
      transactionHash,
      confirmations,
      timeout
    )
  } */

  async detectNetwork(): Promise<any> {
    return this.wallet.getProvider().detectNetwork()
  }

  eth_accounts(): string[] {
    return [this.wallet.getAddress()]
  }
}
