import { CHAIN_NAMESPACES, UserInfo } from '@web3auth/base'
import { Web3Auth } from '@web3auth/modal'
import { ethers } from 'ethers'

import { WEB3AUTH_CLIENT_ID } from '../../constants'
import { EOAAdapter } from '../types'

export class Web3AuthAdapter implements EOAAdapter {
  private web3auth: Web3Auth | null = null
  private ethProvider: ethers.providers.Web3Provider | null = null

  async init(chainId, rpcTarget): Promise<void> {
    if (!chainId) throw new Error('Missing chainId parameter')
    if (!rpcTarget) throw new Error('Missing rpcUrl parameter')

    const web3auth = new Web3Auth({
      clientId: WEB3AUTH_CLIENT_ID,
      web3AuthNetwork: 'testnet',
      chainConfig: {
        chainId: ethers.utils.hexlify(chainId),
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        rpcTarget
      }
    })

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
