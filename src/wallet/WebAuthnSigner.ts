import { Provider } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber, Bytes, ethers } from 'ethers'

import { AlembicWallet } from './AlembicWallet'
import SafeUtils from './SafeUtils'
import { SafeTransactionDataPartial, WebAuthnOwner } from './types'
import WebAuthnUtils from './WebAuthnUtils'

export class WebAuthnSigner extends Signer {
  private chainId
  constructor(private smartWallet: AlembicWallet) {
    super()
    this.chainId = this.smartWallet.chainId
  }

  getAddress(): Promise<string> {
    return Promise.resolve(this.smartWallet.getAddress())
  }

  async getCurrentWebAuthnOwner(): Promise<WebAuthnOwner | undefined> {
    return this.smartWallet.getCurrentWebAuthnOwner()
  }

  async signTransaction(
    safeTxDataTyped: SafeTransactionDataPartial
  ): Promise<string> {
    const currentWebAuthnOwner = await this.getCurrentWebAuthnOwner()
    if (!currentWebAuthnOwner) throw new Error('No WebAuthn signer found')

    const safeTxHash = await SafeUtils.getSafeTransactionHash(
      await this.getAddress(),
      {
        to: safeTxDataTyped.to,
        value: BigNumber.from(safeTxDataTyped.value).toString(),
        data: safeTxDataTyped.data,
        operation: BigNumber.from(safeTxDataTyped.operation).toString(),
        safeTxGas: BigNumber.from(safeTxDataTyped.safeTxGas).toString(),
        baseGas: BigNumber.from(safeTxDataTyped.baseGas).toString(),
        gasPrice: BigNumber.from(safeTxDataTyped.gasPrice).toString(),
        gasToken: ethers.constants.AddressZero,
        refundReceiver: ethers.constants.AddressZero,
        nonce: BigNumber.from(
          safeTxDataTyped.nonce
            ? safeTxDataTyped.nonce
            : await SafeUtils.getNonce(
                await this.getAddress(),
                this.smartWallet.getProvider()
              )
        ).toString()
      },
      this.chainId
    )

    const encodedWebAuthnSignature = await WebAuthnUtils.getWebAuthnSignature(
      safeTxHash,
      currentWebAuthnOwner.publicKeyId
    )

    return SafeUtils.formatWebAuthnSignatureForSafe(
      currentWebAuthnOwner.signerAddress,
      encodedWebAuthnSignature
    )
  }

  async signMessage(messageToSign: string | Bytes): Promise<string> {
    const currentWebAuthnOwner = await this.getCurrentWebAuthnOwner()

    if (!currentWebAuthnOwner) throw new Error('No WebAuthn signer found')

    const encodedWebAuthnSignature = await WebAuthnUtils.getWebAuthnSignature(
      ethers.utils.keccak256(messageToSign),
      currentWebAuthnOwner.publicKeyId
    )

    return SafeUtils.formatWebAuthnSignatureForSafe(
      currentWebAuthnOwner.signerAddress,
      encodedWebAuthnSignature
    )
  }

  connect(provider: Provider): Signer {
    throw new Error('changing providers is not supported')
  }
}
