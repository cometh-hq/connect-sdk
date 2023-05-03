import { UserInfo } from '@web3auth/base'
import { Web3AuthCoreOptions } from '@web3auth/core'
import { Web3Auth, Web3AuthOptions } from '@web3auth/modal'
import { ethers } from 'ethers'

import { AUTHAdapter } from './types'

export class Web3AuthAdapter implements AUTHAdapter {
  private web3auth: Web3Auth | null = null
  private ethProvider: ethers.providers.Web3Provider | null = null
  private web3authConfig: Web3AuthOptions
  readonly chaindId: string

  constructor(web3authConfig: Web3AuthCoreOptions) {
    this.web3authConfig = web3authConfig
    this.chaindId = web3authConfig.chainConfig.chainId!
  }

  async init(): Promise<void> {
    if (!this.web3authConfig) throw new Error('Missing config for web3Auth')

    const web3auth = new Web3Auth(this.web3authConfig)

    if (!web3auth) throw new Error('No Web3Auth created')
    await web3auth.initModal()

    this.web3auth = web3auth
  }

  async connect(): Promise<void> {
    if (!this.web3auth) throw new Error('No Web3Auth instance found')
    await this.web3auth.connect()
    this.ethProvider = new ethers.providers.Web3Provider(
      this.web3auth?.provider as any
    )
  }

  async logout(): Promise<void> {
    if (!this.web3auth) throw new Error('No Web3Auth instance found')
    await this.web3auth.logout()
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

  async getUserInfos(): Promise<Partial<UserInfo>> {
    if (!this.web3auth) throw new Error('No Web3Auth instance found')
    const userInfos = await this.web3auth.getUserInfo()
    return userInfos ?? {}
  }
}
