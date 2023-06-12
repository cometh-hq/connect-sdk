import { Provider } from '@ethersproject/abstract-provider'
import {
  Signer,
  TypedDataDomain,
  TypedDataField
} from '@ethersproject/abstract-signer'
import { BigNumber, Bytes, ethers } from 'ethers'

import { EIP712_SAFE_MESSAGE_TYPE, EIP712_SAFE_TX_TYPES } from '../../constants'
import safeService from '../../services/safeService'
import webAuthnService from '../../services/webAuthnService'
import { AlembicWallet } from '../AlembicWallet'
import { SafeTransactionDataPartial, WebAuthnOwner } from '../types'

export class WebAuthnSigner extends Signer {
  private chainId: number
  constructor(private smartWallet: AlembicWallet) {
    super()
    this.chainId = this.smartWallet.chainId
  }

  getAddress(): Promise<string> {
    return Promise.resolve(this.smartWallet.getAddress())
  }

  getProvider(): Promise<ethers.providers.StaticJsonRpcProvider> {
    return Promise.resolve(this.smartWallet.getProvider())
  }

  async getCurrentWebAuthnOwner(): Promise<WebAuthnOwner | undefined> {
    return this.smartWallet.getCurrentWebAuthnOwner()
  }

  async _signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    value: Record<string, any>
  ): Promise<string> {
    const currentWebAuthnOwner = await this.getCurrentWebAuthnOwner()
    if (!currentWebAuthnOwner) throw new Error('No WebAuthn signer found')

    const data = ethers.utils._TypedDataEncoder.hash(domain, types, value)

    const encodedWebAuthnSignature = await webAuthnService.getWebAuthnSignature(
      ethers.utils.keccak256(value.message),
      currentWebAuthnOwner.publicKeyId
    )

    return safeService.formatWebAuthnSignatureForSafe(
      currentWebAuthnOwner.signerAddress,
      encodedWebAuthnSignature
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
