import { ethers, Wallet } from 'ethers'

import { IConnectionSigning } from '../IConnectionSigning'
import { NewSignerRequest, SupportedNetworks, UserInfos } from '../types'
import { AUTHAdapter } from './types'

export class BurnerWalletAdaptor
  extends IConnectionSigning
  implements AUTHAdapter
{
  private wallet?: Wallet

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
    const ownerAddress = await this.getAccount()
    if (!ownerAddress) throw new Error('No owner address found')
    return await this.API.getWalletAddress(ownerAddress)
  }
  getSigner(): Wallet {
    if (!this.wallet) throw new Error('No Wallet instance found')
    return this.wallet
  }

  async getUserInfos(): Promise<Partial<UserInfos>> {
    if (!this.wallet) throw new Error('No Wallet instance found')
    return { walletAddress: this.wallet.address } ?? {}
  }

  public async createNewSignerRequest(): Promise<void> {
    throw new Error('Not authorized method: createNewSignerRequest')
  }

  public async getNewSignerRequestByUser(): Promise<NewSignerRequest[] | null> {
    throw new Error('Not authorized method: getNewSignerRequestByUser')
  }

  public async deleteNewSignerRequest(signerAddress: string): Promise<void> {
    throw new Error('Not authorized method: deleteNewSignerRequest')
  }

  public async deployWebAuthnSigner(
    newSignerRequest: NewSignerRequest
  ): Promise<string> {
    throw new Error('Not authorized method: deployWebAuthnSigner')
  }
}
