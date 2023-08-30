import { ethers, Wallet } from 'ethers'
import { SiweMessage } from 'siwe'

import { API } from '../../services'
import siweService from '../../services/siweService'
import { UserInfos } from '../types'
import { AUTHAdapter } from './types'

export class BurnerWalletAdaptor implements AUTHAdapter {
  private wallet?: Wallet
  readonly chainId: string
  private API: API

  constructor(chainId: string, apiKey: string) {
    this.chainId = chainId
    this.API = new API(apiKey, +chainId)
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
    const nonce = await this.API.getNonce(walletAddress)
    const message: SiweMessage = siweService.createMessage(
      walletAddress,
      nonce,
      +this.chainId
    )

    const signature = await this.getSigner().signMessage(
      message.prepareMessage()
    )

    await this.API.connectToAlembicWallet({
      message,
      signature,
      walletAddress
    })
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
