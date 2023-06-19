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
import { SafeTransactionDataPartial, WebAuthnOwner } from '../types'

export class WebAuthnSigner extends Signer {
  private webAuthnOwners: WebAuthnOwner[]
  constructor(webAuthnOwners: WebAuthnOwner[]) {
    super()
    this.webAuthnOwners = webAuthnOwners
  }

  async getAddress(): Promise<string> {
    throw new Error('get Address not supported')
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

    const { encodedSignature, signerAddress } =
      await webAuthnService.getWebAuthnSignature(data, this.webAuthnOwners)

    return safeService.formatWebAuthnSignatureForSafe(
      signerAddress,
      encodedSignature
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
