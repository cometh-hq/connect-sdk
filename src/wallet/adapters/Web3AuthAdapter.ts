import { ExternalProvider, JsonRpcSigner } from '@ethersproject/providers'
import { Web3AuthCoreOptions } from '@web3auth/core'
import { Web3Auth, Web3AuthOptions } from '@web3auth/modal'
import { ethers } from 'ethers'

import { UserInfos } from '../types'
import { AUTHAdapter } from './types'

export class Web3AuthAdapter implements AUTHAdapter {
  private web3auth: Web3Auth | null = null
  private ethProvider: ethers.providers.Web3Provider | null = null
  private web3authConfig: Web3AuthOptions
  readonly chainId: string

  constructor(web3authConfig: Web3AuthCoreOptions) {
    this.web3authConfig = web3authConfig
    this.chainId = web3authConfig.chainConfig.chainId!
  }

  async connect(): Promise<void> {
    if (!this.web3authConfig) throw new Error('Missing config for web3Auth')

    const web3auth = new Web3Auth(this.web3authConfig)

    if (!web3auth) throw new Error('No Web3Auth created')
    await web3auth.initModal()

    this.web3auth = web3auth
    if (!this.web3auth) throw new Error('No Web3Auth instance found')
    await this.web3auth.connect()
    this.ethProvider = new ethers.providers.Web3Provider(
      this.web3auth?.provider as ExternalProvider
    )
  }

  async logout(): Promise<void> {
    if (!this.web3auth) throw new Error('No Web3Auth instance found')
    await this.web3auth.logout()
  }

  async getAccount(): Promise<string | null> {
    const signer = this.getSigner()
    if (!signer) throw new Error('No signer found')
    return await signer.getAddress()
  }

  getSigner(): JsonRpcSigner {
    if (!this.ethProvider) throw new Error('No Web3Auth provider found')
    return this.ethProvider.getSigner()
  }

  async getUserInfos(): Promise<Partial<UserInfos>> {
    if (!this.web3auth) throw new Error('No Web3Auth instance found')
    const userInfos = await this.web3auth.getUserInfo()
    return userInfos ?? {}
  }
}
