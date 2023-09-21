import { JsonRpcSigner } from '@ethersproject/providers'
import { ethers } from 'ethers'
import { Magic, MagicSDKAdditionalConfiguration } from 'magic-sdk'

import { IConnectionSigning } from '../IConnectionSigning'
import { NewSignerRequest, UserInfos } from '../types'
import { AUTHAdapter } from './types'

export interface MagicLinkAdapterConfig {
  apiKey: string
  options: MagicSDKAdditionalConfiguration & {
    chainId: string
  }
}

export class MagicLinkAdapter
  extends IConnectionSigning
  implements AUTHAdapter
{
  private magic: Magic | null = null
  private ethProvider: ethers.providers.Web3Provider | null = null
  private magicConfig: MagicLinkAdapterConfig

  constructor(
    magicConfig: MagicLinkAdapterConfig,
    apiKey: string,
    baseUrl?: string
  ) {
    super(magicConfig.options.chainId, apiKey, baseUrl)
    this.magicConfig = magicConfig
  }

  public async connect(): Promise<void> {
    if (!this.magicConfig) throw new Error('Missing config for magicLink')
    const { apiKey, options } = this.magicConfig

    this.magic = new Magic(apiKey, options)

    if (!this.magic) throw new Error('No Magic instance found')
    await this.magic.wallet.connectWithUI()
    const provider = await this.magic.wallet.getProvider()
    this.ethProvider = new ethers.providers.Web3Provider(provider)

    const walletAddress = await this.getWalletAddress()
    await this.signAndConnect(walletAddress, this.getSigner())
  }

  async logout(): Promise<void> {
    if (!this.magic) throw new Error('No magicLink instance found')
    await this.magic.user.logout()
  }

  async getAccount(): Promise<string | null> {
    const signer = this.getSigner()
    if (!signer) throw new Error('No signer found')
    return await signer.getAddress()
  }

  async getWalletAddress(): Promise<string> {
    const ownerAddress = await this.getAccount()
    if (!ownerAddress) throw new Error('No owner address found')
    return await this.API.getWalletAddress(ownerAddress)
  }

  getSigner(): JsonRpcSigner {
    if (!this.ethProvider) throw new Error('No Web3Auth provider found')
    return this.ethProvider.getSigner()
  }

  async getUserInfos(): Promise<Partial<UserInfos>> {
    if (!this.magic) throw new Error('No magicLink instance found')
    const userInfos = await this.magic.user.getInfo()
    return userInfos ?? {}
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
