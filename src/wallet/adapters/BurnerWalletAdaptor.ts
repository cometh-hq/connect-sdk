import { throwStatement } from '@babel/types'
import { ExternalProvider } from '@ethersproject/providers'
import { ethers } from 'ethers'

import { networks } from '../../constants'
import { AUTHAdapter } from './types'

export class BurnerWalletAdaptor implements AUTHAdapter {
  private ethProvider: ethers.providers.JsonRpcProvider | null = null
  private signer: ethers.providers.JsonRpcSigner | undefined = undefined
  private wallet: ethers.Wallet | null = null
  readonly chainId: string

  constructor(chainId: string) {
    this.chainId = chainId
  }

  async init(): Promise<void> {
    const currentPrivateKey = window.localStorage.getItem('burner-private-key')

    if (currentPrivateKey) {
      this.wallet = new ethers.Wallet(currentPrivateKey)
    } else {
      this.wallet = ethers.Wallet.createRandom("'https://polygon-rpc.com'")

      window.localStorage.setItem('burner-private-key', this.wallet.privateKey)
    }
  }

  async connect(): Promise<void> {
    if (this.wallet) {
      this.ethProvider = new ethers.providers.Web3Provider(
        this.wallet.provider as any
      )
      this.signer = this.ethProvider?.getSigner(this.wallet.address)
    }
  }

  async logout(): Promise<void> {
    if (!this.signer) throw new Error('No Burner Wallet instance found')
    this.signer = undefined
  }

  async getAccount(): Promise<string | null> {
    const signer = this.getSigner()
    if (!signer) throw new Error('No signer found')
    const account = await signer.getAddress()
    return account ?? null
  }

  getSigner(): ethers.providers.JsonRpcSigner | null {
    return this.signer ?? null
  }

  async getUserInfos(): Promise<Partial<any>> {
    if (!this.wallet) throw new Error('No Burner Wallet instance found')
    const walletAddress = await this.wallet.address
    return { walletAddress: walletAddress } ?? {}
  }
}
