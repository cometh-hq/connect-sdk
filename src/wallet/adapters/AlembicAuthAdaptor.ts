import { API } from '../../services'
import { AlembicAuthSigner } from '../signers/AlembicAuthSigner'
import { UserInfos } from '../types'
import { AUTHAdapter } from './types'

export class AlembicAuthAdaptor implements AUTHAdapter {
  private signer: AlembicAuthSigner | undefined
  private address: string | undefined
  readonly chainId: string
  private jwtToken: string
  private api: API
  constructor(chainId: string, jwtToken: string) {
    this.chainId = chainId
    this.jwtToken = jwtToken
    this.api = new API('', +chainId)
  }

  async connect(): Promise<void> {
    this.address = await this.api.connectToAlembicWebAuth(this.jwtToken)
    this.signer = new AlembicAuthSigner(
      await this.getAccount(),
      this.chainId,
      this.jwtToken,
      this.api
    )
  }

  async logout(): Promise<void> {
    //if (!this.wallet) throw new Error('No Wallet instance found')
    //this.wallet = undefined
  }

  async getAccount(): Promise<string> {
    if (!this.address) throw new Error('No address found')
    return this.address
  }

  getSigner(): AlembicAuthSigner {
    if (!this.signer) throw new Error('No signer found ??')
    return this.signer
  }

  async getUserInfos(): Promise<Partial<UserInfos>> {
    return { walletAddress: await this.getAccount() } ?? {}
  }
}
