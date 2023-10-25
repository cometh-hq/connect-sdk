import { ethers, Wallet } from 'ethers'

import { IConnectionSigning } from '../IConnectionSigning'
import { SupportedNetworks } from '../types'
import { AUTHAdapter } from './types'

export class BurnerWalletAdaptor
  extends IConnectionSigning
  implements AUTHAdapter
{
  private wallet?: Wallet
  private walletAddress?: string

  constructor(chainId: SupportedNetworks, apiKey: string, baseUrl?: string) {
    super(chainId, apiKey, baseUrl)
  }

  async connect(): Promise<void> {
    const currentPrivateKey = window.localStorage.getItem(
      'burner-wallet-private-key'
    )

    if (currentPrivateKey) {
      this.wallet = new ethers.Wallet(currentPrivateKey)
    } else {
      this.wallet = ethers.Wallet.createRandom()
      window.localStorage.setItem(
        'burner-wallet-private-key',
        this.wallet.privateKey
      )
    }
    const ownerAddress = await this.getAccount()
    if (!ownerAddress) throw new Error('No owner address found')

    this.walletAddress = await this.API.getWalletAddress(ownerAddress)
    await this.signAndConnect(this.walletAddress, this.getSigner())
  }

  async logout(): Promise<void> {
    if (!this.wallet) throw new Error('No Wallet instance found')
    this.wallet = undefined
  }

  async getAccount(): Promise<string> {
    if (!this.wallet) throw new Error('No Wallet instance found')
    return this.wallet.getAddress()
  }

  getWalletAddress(): string {
    if (!this.walletAddress) throw new Error('No Wallet instance found')
    return this.walletAddress
  }

  getSigner(): Wallet {
    if (!this.wallet) throw new Error('No Wallet instance found')
    return this.wallet
  }
}
