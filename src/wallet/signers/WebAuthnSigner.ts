import { Provider } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber, BigNumberish, Bytes, BytesLike, ethers } from 'ethers'

import {
  DEFAULT_BASE_GAS,
  DEFAULT_REWARD_PERCENTILE,
  EIP712_SAFE_MESSAGE_TYPE,
  EIP712_SAFE_TX_TYPES,
  networks
} from '../../constants'
import safeService from '../../services/safeService'
import webAuthnService from '../../services/webAuthnService'
import { AlembicWallet } from '../AlembicWallet'
import { SafeTransactionDataPartial, WebAuthnOwner } from '../types'

export interface TypedDataDomain {
  name?: string
  version?: string
  chainId?: BigNumberish
  verifyingContract?: string
  salt?: BytesLike
}
export interface TypedDataField {
  name: string
  type: string
}

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
  ): Promise<any> {
    const currentWebAuthnOwner = await this.getCurrentWebAuthnOwner()
    if (!currentWebAuthnOwner) throw new Error('No WebAuthn signer found')

    let toSign: any

    console.log(value.message)

    if (types == EIP712_SAFE_TX_TYPES) {
      toSign = safeService.getSafeTransactionHash(
        await this.getAddress(),
        {
          to: value.to,
          value: BigNumber.from(value.value).toString(),
          data: value.data,
          operation: BigNumber.from(value.operation).toString(),
          safeTxGas: BigNumber.from(value.safeTxGas).toString(),
          baseGas: BigNumber.from(value.baseGas).toString(),
          gasPrice: BigNumber.from(value.gasPrice).toString(),
          gasToken: ethers.constants.AddressZero,
          refundReceiver: ethers.constants.AddressZero,
          nonce: BigNumber.from(
            value.nonce
              ? value.nonce
              : await safeService.getNonce(
                  await this.getAddress(),
                  await this.getProvider()
                )
          ).toString()
        },
        this.chainId
      )
    } else {
      toSign = value.message
    }

    const encodedWebAuthnSignature = await webAuthnService.getWebAuthnSignature(
      ethers.utils.keccak256(toSign),
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
    throw new Error('changing providers is not supported')
  }

  async signMessage(messageToSign: string | Bytes): Promise<string> {
    throw new Error('changing providers is not supported')
  }

  connect(provider: Provider): Signer {
    throw new Error('changing providers is not supported')
  }
}
