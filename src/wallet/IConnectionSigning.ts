import { Bytes, ethers } from 'ethers'
import { SiweMessage } from 'siwe'

import { EIP712_SAFE_MESSAGE_TYPE } from '../constants'
import { API } from '../services'
import siweService from '../services/siweService'

export class IConnectionSigning {
  readonly chainId: string
  protected API: API

  constructor(chainId: string, apiKey: string, baseUrl?: string) {
    this.chainId = chainId!
    this.API = new API(apiKey, +chainId, baseUrl)
  }

  async signAndConnect(walletAddress: string, signer: any): Promise<void> {
    const nonce = await this.API.getNonce(walletAddress)

    const message: SiweMessage = siweService.createMessage(
      walletAddress,
      nonce,
      +this.chainId
    )

    const signature = await this.signMessage(
      walletAddress,
      message.prepareMessage(),
      signer
    )

    await this.API.connectToCometh({
      message,
      signature,
      walletAddress
    })
  }

  private async signMessage(
    walletAddress: string,
    messageToSign: string | Bytes,
    signer: any
  ): Promise<string> {
    if (typeof messageToSign === 'string') {
      messageToSign = ethers.utils.hashMessage(messageToSign)
    }

    if (!signer) throw new Error('Sign message: missing signer')

    return await signer._signTypedData(
      {
        chainId: this.chainId,
        verifyingContract: walletAddress
      },
      EIP712_SAFE_MESSAGE_TYPE,
      { message: messageToSign }
    )
  }
}
