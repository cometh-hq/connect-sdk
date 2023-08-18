import { API } from '../../services'
import { PassEncodedSigner } from '../signers'
import { UserInfos } from '../types'
import { AUTHAdapter } from './types'

export class PassEncodedAdaptor implements AUTHAdapter {
  private signer?: PassEncodedSigner
  readonly chainId: string
  private jwtToken: string
  private API: API
  constructor(chainId: string, jwtToken: string, apiKey: string) {
    this.chainId = chainId
    this.jwtToken = jwtToken
    this.API = new API(apiKey, +chainId)
  }

  async connect(password: string): Promise<void> {
    this.signer = new PassEncodedSigner(this.jwtToken, this.API)
    await this.signer.connectSigner(password)
  }

  async logout(): Promise<void> {
    if (!this.signer) throw new Error('No signer instance found')
    this.signer = undefined
  }

  async getAccount(): Promise<string> {
    if (!this.signer) throw new Error('No signer found')
    return this.signer.getAddress()
  }

  getSigner(): PassEncodedSigner {
    if (!this.signer) throw new Error('No signer found')
    return this.signer
  }

  async getUserInfos(): Promise<Partial<UserInfos>> {
    return { walletAddress: await this.getAccount() } ?? {}
  }
}
