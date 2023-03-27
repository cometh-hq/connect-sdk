import {
  Provider,
  TransactionRequest,
  TransactionResponse
} from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber, Bytes } from 'ethers'
import { Deferrable, defineReadOnly } from 'ethers/lib/utils'

import { AlembicProvider } from './AlembicProvider'
import { AlembicWallet } from './AlembicWallet'

export class AlembicSigner extends Signer {
  constructor(
    private smartWallet: AlembicWallet,
    albProvider: AlembicProvider
  ) {
    super()
    defineReadOnly(this, 'provider', albProvider)
  }

  getAddress(): Promise<string> {
    return Promise.resolve(this.smartWallet.getSmartWalletAddress())
  }
  signMessage(message: string | Bytes): Promise<string> {
    return this.smartWallet.signMessage(message)
  }

  async estimateGas(
    transaction: Deferrable<TransactionRequest>
  ): Promise<BigNumber> {
    return BigNumber.from('0')
  }

  async sendTransaction(
    transaction: Deferrable<TransactionRequest>
  ): Promise<TransactionResponse> {
    const tx = await this.populateTransaction(transaction)

    const safeTx = {
      to: tx.to ?? '',
      value: BigNumber.from(tx.value ?? '0').toHexString(),
      data: tx.data?.toString() ?? '0x'
    }

    const transactionResponse = await this.smartWallet.sendTransaction(safeTx)

    if (!this.provider) throw new Error('missing provider')
    return this.provider.getTransaction(transactionResponse.relayId)
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
