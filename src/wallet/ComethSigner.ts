import {
  Provider,
  TransactionRequest,
  TransactionResponse
} from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber, Bytes } from 'ethers'
import { Deferrable, defineReadOnly, resolveProperties } from 'ethers/lib/utils'

import { ComethProvider } from './ComethProvider'
import { ComethWallet } from './ComethWallet'
import { NoProviderFoundError, UnauthorizedMethodError } from './errors'

export class ComethSigner extends Signer {
  constructor(private wallet: ComethWallet, provider: ComethProvider) {
    super()
    defineReadOnly(this, 'provider', provider)
  }

  getAddress(): Promise<string> {
    return Promise.resolve(this.wallet.getAddress())
  }

  signMessage(message: string | Bytes): Promise<string> {
    return this.wallet.signMessage(message)
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

    const transactionResponse = await this.wallet.sendTransaction(safeTx)

    if (!this.provider) throw new NoProviderFoundError()

    return await (this.provider as ComethProvider).getTransaction(
      transactionResponse.safeTxHash,
      transactionResponse.relayId
    )
  }

  signTransaction(
    transaction: Deferrable<TransactionRequest>
  ): Promise<string> {
    throw new UnauthorizedMethodError('signTransaction')
  }

  connect(provider: Provider): Signer {
    throw new UnauthorizedMethodError('connect')
  }
}
