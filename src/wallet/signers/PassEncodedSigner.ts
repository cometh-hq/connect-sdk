import { Provider } from '@ethersproject/abstract-provider'
import {
  Signer,
  TypedDataDomain,
  TypedDataField
} from '@ethersproject/abstract-signer'
import { Bytes, Wallet } from 'ethers'

import { API } from '../../services/API'
import {
  connectEncryptedWallet,
  createEncryptedWallet
} from '../../services/passEncodedService'
import { SafeTransactionDataPartial } from '../types'

export class PassEncodedSigner extends Signer {
  private jwtToken: string
  private API: API
  private wallet: Wallet | undefined
  constructor(jwtToken: string, api: API) {
    super()
    this.jwtToken = jwtToken
    this.API = api
  }

  async getAddress(): Promise<string> {
    return this.wallet?.address ?? ''
  }

  async connectSigner(password: string): Promise<void> {
    const { encryptionKeyAlreadyExist, userId } =
      await this.API.verifyEncryptionKey(this.jwtToken)
    if (encryptionKeyAlreadyExist) {
      this.wallet = await createEncryptedWallet(
        password,
        userId,
        this.jwtToken,
        this.API
      )
    } else {
      this.wallet = await connectEncryptedWallet(
        password,
        userId,
        this.jwtToken,
        this.API
      )
    }
  }

  async _signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    value: Record<string, any>
  ): Promise<string> {
    if (!this.wallet) throw new Error('No Wallet instance found')
    return this.wallet._signTypedData(domain, types, value)
  }

  async signTransaction(
    safeTxDataTyped: SafeTransactionDataPartial
  ): Promise<string> {
    throw new Error('sign Transaction not supported')
  }

  async signMessage(messageToSign: string | Bytes): Promise<string> {
    throw new Error('sign Message not supported')
  }

  connect(provider: Provider): Signer {
    throw new Error('changing providers is not supported')
  }
}
