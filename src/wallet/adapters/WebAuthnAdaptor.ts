import { StaticJsonRpcProvider } from '@ethersproject/providers'

import { networks } from '../../constants'
import { API } from '../../services'
import webAuthnService from '../../services/webAuthnService'
import { WebAuthnSigner } from '../signers/WebAuthnSigner'
import { UserInfos } from '../types'
import { AUTHAdapter } from './types'

export class WebAuthnAdaptor implements AUTHAdapter {
  private signer?: WebAuthnSigner
  readonly chainId: string
  private API: API
  private jwtToken: string
  private provider: StaticJsonRpcProvider
  constructor(
    chainId: string,
    jwtToken: string,
    apiKey: string,
    rpcUrl?: string
  ) {
    this.chainId = chainId
    this.API = new API(apiKey, +chainId)
    this.jwtToken = jwtToken
    this.provider = new StaticJsonRpcProvider(
      rpcUrl ? rpcUrl : networks[+this.chainId].RPCUrl
    )
  }

  async connect(): Promise<void> {
    try {
      const { publicKeyId, signerAddress } =
        await webAuthnService.createOrGetWebAuthnOwner(
          this.jwtToken,
          this.chainId,
          this.provider,
          this.API,
          undefined
        )
      this.signer = new WebAuthnSigner(publicKeyId, signerAddress)
    } catch (err) {
      console.debug(err)
    }
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

  async getWalletAddress(): Promise<string> {
    const ownerAddress = await this.getAccount()
    if (!ownerAddress) throw new Error('No owner address found')
    return await this.API.getWalletAddress(ownerAddress)
  }

  async getUserInfos(): Promise<Partial<UserInfos>> {
    return { walletAddress: await this.getAccount() } ?? {}
  }
}
