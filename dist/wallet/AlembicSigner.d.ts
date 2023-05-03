import {
  Provider,
  TransactionRequest,
  TransactionResponse
} from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { Bytes } from 'ethers'
import { Deferrable } from 'ethers/lib/utils'

import { AlembicProvider } from './AlembicProvider'
import { AlembicWallet } from './AlembicWallet'
export declare class AlembicSigner extends Signer {
  private smartWallet
  constructor(smartWallet: AlembicWallet, albProvider: AlembicProvider)
  getAddress(): Promise<string>
  signMessage(message: string | Bytes): Promise<string>
  sendTransaction(
    transaction: Deferrable<TransactionRequest>
  ): Promise<TransactionResponse>
  signTransaction(transaction: Deferrable<TransactionRequest>): Promise<string>
  connect(provider: Provider): Signer
}
