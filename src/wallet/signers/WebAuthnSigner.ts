import { Provider } from '@ethersproject/abstract-provider'
import {
  Signer,
  TypedDataDomain,
  TypedDataField
} from '@ethersproject/abstract-signer'
import { Bytes, ethers } from 'ethers'

import { EIP712_SAFE_MESSAGE_TYPE, EIP712_SAFE_TX_TYPES } from '../../constants'
import safeService from '../../services/safeService'
import webAuthnService from '../../services/webAuthnService'
import { parseHex } from '../../utils/utils'
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
    if (types !== EIP712_SAFE_TX_TYPES && types !== EIP712_SAFE_MESSAGE_TYPE)
      throw new Error('types data not supported')

    const data =
      types === EIP712_SAFE_TX_TYPES
        ? ethers.utils._TypedDataEncoder.hash(domain, types, value)
        : ethers.utils.keccak256(value.message)

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
    throw new Error('Not authorized method: signTransaction')
  }

  async signMessage(messageToSign: string | Bytes): Promise<string> {
    throw new Error('Not authorized method: signMessage')
  }

  connect(provider: Provider): Signer {
    throw new Error('Not authorized method: connect')
  }
}
