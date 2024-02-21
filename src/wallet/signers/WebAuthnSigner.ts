import { Provider } from '@ethersproject/abstract-provider'
import {
  Signer,
  TypedDataDomain,
  TypedDataField
} from '@ethersproject/abstract-signer'
import { Bytes } from 'ethers'
import { _TypedDataEncoder, keccak256 } from 'ethers/lib/utils'
import _ from 'lodash'

import { EIP712_SAFE_MESSAGE_TYPE, EIP712_SAFE_TX_TYPES } from '../../constants'
import safeService from '../../services/safeService'
import webAuthnService from '../../services/webAuthnService'
import { parseHex } from '../../utils/utils'
import { TypedDataNotSupportedError, UnauthorizedMethodError } from '../errors'
import { SafeTransactionDataPartial } from '../types'

export class WebAuthnSigner extends Signer {
  private publicKeyId: string
  private signerAddress: string
  constructor(publicKeyId: string, signerAddress: string) {
    super()
    this.publicKeyId = publicKeyId
    this.signerAddress = signerAddress
  }

  async getAddress(): Promise<string> {
    return this.signerAddress ?? ''
  }

  async _signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    value: Record<string, any>
  ): Promise<string> {
    const IS_SAFE_MESSAGE_TYPE = _.isEqual(types, EIP712_SAFE_MESSAGE_TYPE)
    const IS_SAFE_TX_TYPE = _.isEqual(types, EIP712_SAFE_TX_TYPES)

    if (!IS_SAFE_MESSAGE_TYPE && !IS_SAFE_TX_TYPE)
      throw new TypedDataNotSupportedError()

    const data = IS_SAFE_TX_TYPE
      ? _TypedDataEncoder.hash(domain, types, value)
      : keccak256(value.message)

    const publicKeyCredential: PublicKeyCredentialDescriptor[] = [
      {
        id: parseHex(this.publicKeyId),
        type: 'public-key'
      }
    ]

    const { encodedSignature } = await webAuthnService.getWebAuthnSignature(
      data,
      publicKeyCredential
    )

    return safeService.formatWebAuthnSignatureForSafe(
      this.signerAddress,
      encodedSignature
    )
  }

  async signTransaction(
    safeTxDataTyped: SafeTransactionDataPartial
  ): Promise<string> {
    throw new UnauthorizedMethodError('signTransaction')
  }

  async signMessage(messageToSign: string | Bytes): Promise<string> {
    throw new UnauthorizedMethodError('signMessage')
  }

  connect(provider: Provider): Signer {
    throw new UnauthorizedMethodError('connect')
  }
}
