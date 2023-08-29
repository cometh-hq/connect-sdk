import { ethers, Wallet } from 'ethers'
import { SiweMessage } from 'siwe'

import { API } from '../../services'
import siweService from '../../services/siweService'
import { UserInfos } from '../types'
import { AUTHAdapter } from './types'

export class CustomAuthAdaptor implements AUTHAdapter {
  private wallet?: Wallet
  readonly chainId: string
  private API: API
  private jwtToken: string

  constructor(chainId: string, jwtToken: string, apiKey: string) {
    this.chainId = chainId
    this.jwtToken = jwtToken
    this.API = new API(apiKey, +chainId)
  }

  async connect(): Promise<void> {
    const currentPrivateKey = window.localStorage.getItem('custom-auth-connect')

    if (currentPrivateKey) {
      this.wallet = new ethers.Wallet(currentPrivateKey)
    } else {
      this.wallet = ethers.Wallet.createRandom()
      window.localStorage.setItem('custom-auth-connect', this.wallet.privateKey)
    }
    const nonce = await this.API.getNonce(this.wallet.address)
    const message: SiweMessage = siweService.createMessage(
      this.wallet.address,
      nonce,
      +this.chainId
    )
    const signature = await this.wallet.signMessage(message.prepareMessage())

    await this.API.customConnectToAlembicWallet({
      token: this.jwtToken,
      message,
      signature,
      walletAddress: this.wallet.address
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

  getSigner(): Wallet {
    if (!this.wallet) throw new Error('No Wallet instance found')
    return this.wallet
  }

  async getUserInfos(): Promise<Partial<UserInfos>> {
    if (!this.wallet) throw new Error('No Wallet instance found')
    return { walletAddress: this.wallet.address } ?? {}
  }
}
