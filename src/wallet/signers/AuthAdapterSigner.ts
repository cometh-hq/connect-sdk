import { Provider } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber, Bytes, ethers } from 'ethers'

import { EIP712_SAFE_MESSAGE_TYPE, EIP712_SAFE_TX_TYPES } from '../../constants'
import safeService from '../../services/safeService'
import { AlembicWallet } from '../AlembicWallet'
import { SafeTransactionDataPartial, WebAuthnOwner } from '../types'

export class AuthAdapterSigner extends Signer {
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
    safeTxData: SafeTransactionDataPartial
  ): Promise<string> {
    const signer = this.smartWallet.authAdapter.getSigner()
    if (!signer) throw new Error('Sign message: missing signer')

    return await signer._signTypedData(
      {
        chainId: this.chainId,
        verifyingContract: await this.getAddress()
      },
      EIP712_SAFE_TX_TYPES,
      {
        to: safeTxData.to,
        value: BigNumber.from(safeTxData.value).toString(),
        data: safeTxData.data,
        operation: safeTxData.operation,
        safeTxGas: BigNumber.from(safeTxData.safeTxGas).toString(),
        baseGas: BigNumber.from(safeTxData.baseGas).toString(),
        gasPrice: BigNumber.from(safeTxData.gasPrice).toString(),
        gasToken: ethers.constants.AddressZero,
        refundReceiver: ethers.constants.AddressZero,
        nonce: BigNumber.from(
          safeTxData.nonce
            ? safeTxData.nonce
            : await safeService.getNonce(
                await this.getAddress(),
                await this.getProvider()
              )
        ).toString()
      }
    )
  }

  async signMessage(messageToSign: string | Bytes): Promise<string> {
    const signer = this.smartWallet.authAdapter.getSigner()
    if (!signer) throw new Error('Sign message: missing signer')

    return await signer._signTypedData(
      {
        chainId: this.chainId,
        verifyingContract: await this.getAddress()
      },
      EIP712_SAFE_MESSAGE_TYPE,
      { message: messageToSign }
    )
  }

  connect(provider: Provider): Signer {
    throw new Error('changing providers is not supported')
  }
}
