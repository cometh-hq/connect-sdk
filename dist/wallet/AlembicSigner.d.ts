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
import { WebAuthnOwner } from './types'
export declare class AlembicSigner extends Signer {
  private smartWallet
  constructor(smartWallet: AlembicWallet, albProvider: AlembicProvider)
  getAddress(): Promise<string>
  getCurrentWebAuthnOwner(): WebAuthnOwner | undefined
  signMessage(message: string | Bytes): Promise<string>
  sendTransaction(
    transaction: Deferrable<TransactionRequest>
  ): Promise<TransactionResponse>
  addWebAuthnOwner(): Promise<string>
  signTransaction(transaction: Deferrable<TransactionRequest>): Promise<string>
  connect(provider: Provider): Signer
}
