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
    const walletAddress = await this.API.getWalletAddressFromUserID(
      this.jwtToken
    )
    if (!walletAddress) {
      const ownerAddress = await this.getAccount()
      if (!ownerAddress) throw new Error('No owner address found')
      await this.API.initWalletForUserID({ token: this.jwtToken, ownerAddress })
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

  async getWalletAddress(): Promise<string> {
    const ownerAddress = await this.getAccount()
    if (!ownerAddress) throw new Error('No owner address found')
    return await this.API.getWalletAddress(ownerAddress)
  }

  async getUserInfos(): Promise<Partial<UserInfos>> {
    if (!this.wallet) throw new Error('No Wallet instance found')
    return { walletAddress: this.wallet.address } ?? {}
  }
}
