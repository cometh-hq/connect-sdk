import { API } from '../../services'
import { AlembicAuthSigner } from '../signers/AlembicAuthSigner'
import { UserInfos } from '../types'
import { AUTHAdapter } from './types'

export class AlembicAuthAdaptor implements AUTHAdapter {
  private signer?: AlembicAuthSigner
  readonly chainId: string
  private jwtToken: string
  private API: API
  constructor(chainId: string, jwtToken: string, apiKey: string) {
    this.chainId = chainId
    this.jwtToken = jwtToken
    this.API = new API(apiKey, +chainId)
  }

  async connect(): Promise<void> {
    this.signer = new AlembicAuthSigner(this.jwtToken, this.API)
    await this.signer.connectSigner()
  }

  async logout(): Promise<void> {
    if (!this.signer) throw new Error('No signer instance found')
    this.signer = undefined
  }

  async getAccount(): Promise<string> {
    if (!this.signer) throw new Error('No signer found')
    return this.signer.getAddress()
  }

  getSigner(): AlembicAuthSigner {
    if (!this.signer) throw new Error('No signer found')
    return this.signer
  }

  async getUserInfos(): Promise<Partial<UserInfos>> {
    return { walletAddress: await this.getAccount() } ?? {}
  }
}
