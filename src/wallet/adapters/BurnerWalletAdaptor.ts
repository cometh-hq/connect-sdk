import { ethers, Wallet } from 'ethers'

import { IConnectionSigning } from '../IConnectionSigning'
import { UserInfos } from '../types'
import { AUTHAdapter } from './types'

export class BurnerWalletAdaptor
  extends IConnectionSigning
  implements AUTHAdapter
{
  private wallet?: Wallet

  constructor(chainId: string, apiKey: string) {
    super(chainId, apiKey)
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
    const walletAddress = await this.getWalletAddress()
    await this.signAndConnect(walletAddress, this.getSigner())
  }

  async logout(): Promise<void> {
    if (!this.wallet) throw new Error('No Wallet instance found')
    this.wallet = undefined
  }

  async getAccount(): Promise<string> {
    if (!this.wallet) throw new Error('No Wallet instance found')
    return this.wallet.getAddress()
  }

  async getWalletAddress(): Promise<string> {
    if (!this.wallet) throw new Error('No Wallet instance found')
    return this.wallet.address
  }

  getSigner(): Wallet {
    if (!this.wallet) throw new Error('No Wallet instance found')
    return this.wallet
  }

  async getUserInfos(): Promise<Partial<UserInfos>> {
    if (!this.wallet) throw new Error('No Wallet instance found')
    return { walletAddress: this.wallet.address } ?? {}
  }
}
