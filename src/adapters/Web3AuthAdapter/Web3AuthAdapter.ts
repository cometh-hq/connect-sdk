import { CHAIN_NAMESPACES, SafeEventEmitterProvider } from '@web3auth/base'
import { Web3Auth } from '@web3auth/modal'
import { ethers } from 'ethers'

import { WEB3AUTH_CLIENT_ID } from '../../constants'
import { OwnerAddress } from '../../types'
import { EOAAdapter } from '../types'

export class Web3AuthAdapter implements EOAAdapter {
  #web3auth: Web3Auth | null = null
  #ethProvider: ethers.providers.Web3Provider | null = null

  public async init(chainId, rpcTarget): Promise<void> {
    if (!chainId) throw new Error('Missing chainId parameter')
    if (!rpcTarget) throw new Error('Missing rpcUrl parameter')

    const web3auth = new Web3Auth({
      clientId: WEB3AUTH_CLIENT_ID,
      web3AuthNetwork: 'mainnet',
      chainConfig: {
        chainId: ethers.utils.hexlify(chainId),
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        rpcTarget
      }
    })

    if (!web3auth) throw new Error('No Web3Auth created')
    await web3auth.initModal()

    this.#web3auth = web3auth
    this.#ethProvider = new ethers.providers.Web3Provider(
      web3auth?.provider as any
    )
  }

  public async connect(): Promise<void> {
    if (!this.#web3auth) throw new Error('No Web3Auth instance found')
    await this.#web3auth.connect()
  }

  public async logout(): Promise<void> {
    if (!this.#web3auth) throw new Error('No Web3Auth instance found')
    await this.#web3auth.logout()
  }

  public async getAccount(): Promise<OwnerAddress | null> {
    if (!this.#ethProvider) throw new Error('No Web3Auth provider found')
    const account = (await this.#ethProvider.listAccounts())[0] as OwnerAddress
    return account ?? null
  }

  public async getSigner(): Promise<ethers.Signer | null> {
    if (!this.#ethProvider) throw new Error('No Web3Auth provider found')
    const signer = this.#ethProvider.getSigner()
    return signer ?? null
  }
}
