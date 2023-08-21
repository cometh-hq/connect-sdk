import { StaticJsonRpcProvider } from '@ethersproject/providers'

import { networks } from '../../constants'
import { API } from '../../services'
import webAuthnService from '../../services/webAuthnService'
import { WebAuthnSigner } from '../signers/WebAuthnSigner'
import { AlembicInitOptions, UserInfos } from '../types'
import { AUTHAdapter } from './types'

export class WebAuthnAdaptor implements AUTHAdapter {
  private signer?: WebAuthnSigner
  readonly chainId: string
  private API: API
  private provider: StaticJsonRpcProvider
  constructor(chainId: string, apiKey: string, rpcUrl?: string) {
    this.chainId = chainId
    this.API = new API(apiKey, +chainId)
    this.provider = new StaticJsonRpcProvider(
      rpcUrl ? rpcUrl : networks[+this.chainId].RPCUrl
    )
  }

  async connect(alembicInitOptions: AlembicInitOptions): Promise<void> {
    if (!alembicInitOptions.userId) throw new Error('no userId found')

    const { publicKeyId, signerAddress } =
      await webAuthnService.createOrGetWebAuthnOwner(
        alembicInitOptions.userId,
        this.chainId,
        this.provider,
        this.API
      )

    this.signer = new WebAuthnSigner(publicKeyId, signerAddress)
  }

  async logout(): Promise<void> {
    if (!this.signer) throw new Error('No signer instance found')
    this.signer = undefined
  }

  async getAccount(): Promise<string> {
    if (!this.signer) throw new Error('No signer found')
    return this.signer.getAddress()
  }

  getSigner(): WebAuthnSigner {
    if (!this.signer) throw new Error('No signer found')
    return this.signer
  }

  async getUserInfos(): Promise<Partial<UserInfos>> {
    return { walletAddress: await this.getAccount() } ?? {}
  }
}
