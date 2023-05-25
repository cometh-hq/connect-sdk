import { ethers, Wallet } from 'ethers'

import { UserInfos } from '../types'
import { AUTHAdapter } from './types'

export class BurnerWalletAdaptor implements AUTHAdapter {
  private wallet: ethers.Wallet | undefined = undefined
  readonly chainId: string

  constructor(chainId: string) {
    this.chainId = chainId
  }

  async init(): Promise<void> {
    const currentPrivateKey = window.localStorage.getItem('burner-private-key')

    if (currentPrivateKey) {
      this.wallet = new ethers.Wallet(currentPrivateKey)
    } else {
      this.wallet = ethers.Wallet.createRandom()
      window.localStorage.setItem('burner-private-key', this.wallet.privateKey)
    }
  }

  async logout(): Promise<void> {
    if (!this.wallet) throw new Error('No Burner Wallet instance found')
    this.wallet = undefined
  }

  async getAccount(): Promise<string> {
    const signer = this.getSigner()
    if (!signer) throw new Error('No signer found')
    return await signer.getAddress()
  }

  getSigner(): Wallet {
    if (!this.wallet) throw new Error('No Burner Wallet instance found')
    return this.wallet
  }

  async getUserInfos(): Promise<Partial<UserInfos>> {
    if (!this.wallet) throw new Error('No Burner Wallet instance found')
    const walletAddress = await this.wallet.address
    return { walletAddress: walletAddress } ?? {}
  }
}
