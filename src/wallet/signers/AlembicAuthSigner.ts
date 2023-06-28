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
  private address?: string
  private jwtToken: string
  private API: API
  constructor(jwtToken: string, api: API) {
    super()
    this.jwtToken = jwtToken
    this.API = api
  }

  async getAddress(): Promise<string> {
    return this.address ?? ''
  }

  async connectSigner(): Promise<string> {
    this.address = await this.API.connectToAlembicAuth(this.jwtToken)
    return this.address
  }

  async _signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    value: Record<string, any>
  ): Promise<string> {
    return this.API.signTypedDataWithAlembicAuth(
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