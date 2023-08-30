import { IConnectionSigning } from '../IConnectionSigning'
import { PassEncodedSigner } from '../signers'
import { AlembicInitOptions, UserInfos } from '../types'
import { AUTHAdapter } from './types'

export class PassEncodedAdaptor
  extends IConnectionSigning
  implements AUTHAdapter
{
  private signer?: PassEncodedSigner
  private jwtToken: string

  constructor(chainId: string, jwtToken: string, apiKey: string) {
    super(chainId, apiKey)
    this.jwtToken = jwtToken
  }

  async connect(alembicInitOptions: AlembicInitOptions): Promise<void> {
    if (!alembicInitOptions.password) throw new Error('no password found')

    this.signer = new PassEncodedSigner(this.jwtToken, this.API)

    await this.signer.connectSigner(alembicInitOptions.password)

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

  getSigner(): PassEncodedSigner {
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
