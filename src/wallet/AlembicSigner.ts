import {
  Provider,
  TransactionRequest,
  TransactionResponse
} from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber, Bytes } from 'ethers'
import { Deferrable, defineReadOnly, resolveProperties } from 'ethers/lib/utils'

import { AlembicProvider } from './AlembicProvider'
import { AlembicWallet } from './AlembicWallet'
import { MetaTransactionData, WebAuthnOwner } from './types'

export class AlembicSigner extends Signer {
  constructor(
    private smartWallet: AlembicWallet,
    albProvider: AlembicProvider
  ) {
    super()
    defineReadOnly(this, 'provider', albProvider)
  }

  getAddress(): Promise<string> {
    return Promise.resolve(this.smartWallet.getAddress())
  }

  async getCurrentWebAuthnOwner(): Promise<WebAuthnOwner | undefined> {
    return this.smartWallet.getCurrentWebAuthnOwner()
  }
  signMessage(message: string | Bytes): Promise<string> {
    return this.smartWallet.signMessage(message)
  }

  async sendTransaction(
    transaction: Deferrable<TransactionRequest>
  ): Promise<TransactionResponse> {
    const tx: TransactionRequest = await resolveProperties(
      this.checkTransaction(transaction)
    )

    const safeTx = {
      to: tx.to ?? '',
      value: BigNumber.from(tx.value ?? '0').toHexString(),
      data: tx.data?.toString() ?? '0x'
    }

    const transactionResponse = await this.smartWallet.sendTransaction(safeTx)

    if (!this.provider) throw new Error('missing provider')

    return await this.provider.getTransaction(transactionResponse.safeTxHash)
  }

  async sendBatchTransactions(
    transactions: MetaTransactionData[]
  ): Promise<TransactionResponse> {
    const transactionResponse = await this.smartWallet.sendBatchTransactions(
      transactions
    )

    if (!this.provider) throw new Error('missing provider')

    return await this.provider.getTransaction(transactionResponse.safeTxHash)
  }

  async addWebAuthnOwner(): Promise<string> {
    return this.smartWallet.addWebAuthnOwner()
  }

  signTransaction(
    transaction: Deferrable<TransactionRequest>
  ): Promise<string> {
    throw new Error('Method not implemented.')
  }
  connect(provider: Provider): Signer {
    throw new Error('changing providers is not supported')
  }
}
