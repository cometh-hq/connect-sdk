import { Signer } from 'ethers'
import { SiweMessage } from 'siwe'

import { API } from '../services'
import siweService from '../services/siweService'

export class IConnectionSigning {
  readonly chainId: string
  protected API: API

  constructor(chainId: string, apiKey: string) {
    this.chainId = chainId!
    this.API = new API(apiKey, +chainId)
  }

  async signAndConnect(walletAddress: string, signer: Signer): Promise<void> {
    const nonce = await this.API.getNonce(walletAddress)
    const message: SiweMessage = siweService.createMessage(
      walletAddress,
      nonce,
      +this.chainId
    )

    const signature = await signer.signMessage(message.prepareMessage())

    await this.API.connectToAlembicWallet({
      message,
      signature,
      walletAddress
    })
  }
}
