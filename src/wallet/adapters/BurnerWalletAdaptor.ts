import { ethers, Wallet } from 'ethers'

import { UserInfos } from '../types'
import { AUTHAdapter } from './types'

export class BurnerWalletAdaptor implements AUTHAdapter {
  private wallet: Wallet | undefined
  readonly chainId: string

  constructor(chainId: string) {
    this.chainId = chainId
  }

  async init(): Promise<void> {
    const currentPrivateKey = window.localStorage.getItem(
      'burnerWallet-private-key'
    )

    if (currentPrivateKey) {
      this.wallet = new ethers.Wallet(currentPrivateKey)
    } else {
      this.wallet = ethers.Wallet.createRandom()
      window.localStorage.setItem(
        'burnerWallet-private-key',
        this.wallet.privateKey
      )
    }
  }

  async logout(): Promise<void> {
    if (!this.wallet) throw new Error('No Wallet instance found')
    this.wallet = undefined
  }

  async getAccount(): Promise<string> {
    if (!this.wallet) throw new Error('No Wallet instance found')
    return this.wallet.getAddress()
  }

  getSigner(): Wallet {
    if (!this.wallet) throw new Error('No Wallet instance found')
    return this.wallet
  }

  async getUserInfos(): Promise<Partial<UserInfos>> {
    if (!this.wallet) throw new Error('No Wallet instance found')
    return { walletAddress: await this.wallet.address } ?? {}
  }
}
