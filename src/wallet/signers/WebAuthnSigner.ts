import { Provider } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber, Bytes, ethers } from 'ethers'

import safeService from '../../services/safeService'
import webAuthnService from '../../services/webAuthnService'
import { AlembicWallet } from '../AlembicWallet'
import { SafeTransactionDataPartial, WebAuthnOwner } from '../types'

export class WebAuthnSigner extends Signer {
  private chainId
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

  async signTransaction(
    safeTxDataTyped: SafeTransactionDataPartial
  ): Promise<string> {
    const currentWebAuthnOwner = await this.getCurrentWebAuthnOwner()
    if (!currentWebAuthnOwner) throw new Error('No WebAuthn signer found')

    const safeTxHash = await safeService.getSafeTransactionHash(
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
            : await safeService.getNonce(
                await this.getAddress(),
                await this.getProvider()
              )
        ).toString()
      },
      this.chainId
    )

    const encodedWebAuthnSignature = await webAuthnService.getWebAuthnSignature(
      safeTxHash,
      currentWebAuthnOwner.publicKeyId
    )

    return safeService.formatWebAuthnSignatureForSafe(
      currentWebAuthnOwner.signerAddress,
      encodedWebAuthnSignature
    )
  }

  async signMessage(messageToSign: string | Bytes): Promise<string> {
    const currentWebAuthnOwner = await this.getCurrentWebAuthnOwner()

    if (!currentWebAuthnOwner) throw new Error('No WebAuthn signer found')

    const encodedWebAuthnSignature = await webAuthnService.getWebAuthnSignature(
      ethers.utils.keccak256(messageToSign),
      currentWebAuthnOwner.publicKeyId
    )

    return safeService.formatWebAuthnSignatureForSafe(
      currentWebAuthnOwner.signerAddress,
      encodedWebAuthnSignature
    )
  }

  connect(provider: Provider): Signer {
    throw new Error('changing providers is not supported')
  }
}
