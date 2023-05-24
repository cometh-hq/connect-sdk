import { ethers } from 'ethers'

import { networks } from '../../constants'
import { UserInfos } from '../types'
import { AUTHAdapter } from './types'

export class BurnerWalletAdaptor implements AUTHAdapter {
  private ethProvider: ethers.providers.Web3Provider | null = null
  private wallet: ethers.Wallet | null = null
  readonly chainId: string

  constructor(chainId: string, rpcUrl: string) {
    this.chainId = chainId
    this.ethProvider = new ethers.providers.Web3Provider(
      rpcUrl ? rpcUrl : networks[this.chainId].RPCUrl
    )
  }

  async init(): Promise<void> {
    this.wallet = ethers.Wallet.createRandom()
  }

  async connect(): Promise<void> {
    const wallet = ethers.Wallet.createRandom()
  }

  async logout(): Promise<void> {
    /*    if (!this.web3auth) throw new Error('No Web3Auth instance found')
    await this.web3auth.logout() */
  }

  async getAccount(): Promise<string | null> {
    const signer = this.getSigner()
    if (!signer) throw new Error('No signer found')
    const account = await signer.getAddress()
    return account ?? null
  }

  getSigner(): ethers.Signer | null {
    if (!this.ethProvider) throw new Error('No Web3Auth provider found')
    const signer = this.ethProvider.getSigner()
    return signer ?? null
  }

  getEthProvider(): ethers.providers.Web3Provider | null {
    return this.ethProvider ?? null
  }

  async getUserInfos(): Promise<Partial<any>> {
    if (!this.wallet) throw new Error('No BurnerWallet instance found')
    const walletAddress = await this.wallet.address
    return { walletAddress: walletAddress } ?? {}
  }
}
