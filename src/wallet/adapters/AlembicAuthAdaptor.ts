import { IConnectionSigning } from '../IConnectionSigning'
import { AlembicAuthSigner } from '../signers/AlembicAuthSigner'
import { UserInfos } from '../types'
import { AUTHAdapter } from './types'

export class AlembicAuthAdaptor
  extends IConnectionSigning
  implements AUTHAdapter
{
  private signer?: AlembicAuthSigner
  private jwtToken: string
  constructor(chainId: string, jwtToken: string, apiKey: string) {
    super(chainId, apiKey)
    this.jwtToken = jwtToken
  }

  async connect(): Promise<void> {
    this.signer = new AlembicAuthSigner(this.jwtToken, this.API)
    await this.signer.connectSigner()

    const walletAddress = await this.getWalletAddress()
    await this.signConnectionMessage(walletAddress, this.getSigner())
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

  async getWalletAddress(): Promise<string> {
    const ownerAddress = await this.getAccount()
    if (!ownerAddress) throw new Error('No owner address found')
    return await this.API.getWalletAddress(ownerAddress)
  }

  async getUserInfos(): Promise<Partial<UserInfos>> {
    return { walletAddress: await this.getAccount() } ?? {}
  }
}
