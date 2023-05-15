import { ethers } from 'ethers'
import { Magic, MagicSDKAdditionalConfiguration } from 'magic-sdk'

import { UserInfos } from '../types'
import { AUTHAdapter } from './types'

export interface MagicLinkAdapterConfig {
  apiKey: string
  options: MagicSDKAdditionalConfiguration & {
    chainId: string
  }
}

export class MagicLinkAdapter implements AUTHAdapter {
  private magic: Magic | null = null
  private ethProvider: ethers.providers.Web3Provider | null = null
  private magicConfig: MagicLinkAdapterConfig
  readonly chaindId: string

  constructor(magicConfig: MagicLinkAdapterConfig) {
    this.magicConfig = magicConfig
    this.chaindId = magicConfig.options.chainId!
  }

  public async init(): Promise<void> {
    if (!this.magicConfig) throw new Error('Missing config for magicLink')
    const { apiKey, options } = this.magicConfig

    const magic = new Magic(apiKey, options)
    this.magic = magic
  }

  public async connect(): Promise<void> {
    if (!this.magic) throw new Error('No Magic instance found')
    await this.magic.wallet.connectWithUI()
    const provider = await this.magic.wallet.getProvider()
    this.ethProvider = new ethers.providers.Web3Provider(provider)
  }

  async logout(): Promise<void> {
    if (!this.magic) throw new Error('No magicLink instance found')
    await this.magic.user.logout()
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

  async getUserInfos(): Promise<Partial<UserInfos>> {
    if (!this.magic) throw new Error('No magicLink instance found')
    const userInfos = await this.magic.user.getMetadata()

    return userInfos ?? {}
  }
}
