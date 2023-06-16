import { Provider } from '@ethersproject/abstract-provider'
import {
  Signer,
  TypedDataDomain,
  TypedDataField
} from '@ethersproject/abstract-signer'
import { Bytes } from 'ethers'

import { API } from '../../services/API'
import { SafeTransactionDataPartial } from '../types'

export class AlembicAuthSigner extends Signer {
  readonly owner: string
  readonly chainId: string
  private jwtToken: string
  private api: API
  constructor(owner: string, chainId: string, jwtToken: string, api: API) {
    super()
    this.owner = owner
    this.chainId = chainId
    this.jwtToken = jwtToken
    this.api = api
  }

  async getAddress(): Promise<string> {
    return this.owner
  }

  async _signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    value: Record<string, any>
  ): Promise<string> {
    return this.api.signTypedDataWithAlembicWebAuth(
      this.jwtToken,
      domain,
      types,
      value
    )
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
