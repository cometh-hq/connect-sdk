import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { ethers, Wallet } from 'ethers'

import { networks } from '../../constants'
import { API } from '../../services'
import safeService from '../../services/safeService'
import webAuthnService from '../../services/webAuthnService'
import { WebAuthnSigner } from '../signers/WebAuthnSigner'
import { UserInfos } from '../types'
import { AUTHAdapter } from './types'

export class CustomAuthAdaptor implements AUTHAdapter {
  private signer?: WebAuthnSigner | Wallet
  readonly chainId: string
  private API: API
  private jwtToken: string
  private provider: StaticJsonRpcProvider

  constructor(
    chainId: string,
    jwtToken: string,
    apiKey: string,
    rpcUrl?: string,
    baseUrl?: string
  ) {
    this.chainId = chainId
    this.jwtToken = jwtToken
    this.API = new API(apiKey, +chainId, baseUrl)
    this.provider = new StaticJsonRpcProvider(
      rpcUrl ? rpcUrl : networks[+this.chainId].RPCUrl
    )
  }

  async connect(): Promise<void> {
    const walletAddress = await this.API.getWalletAddressFromUserID(
      this.jwtToken
    )
    const isWebAuthnCompatible = await webAuthnService.isWebAuthnCompatible()

    if (!isWebAuthnCompatible) {
      try {
        this.createOrGetBurnerWallet(walletAddress)
      } catch (err) {
        console.log(err)
        return
      }
    } else {
      try {
        const { publicKeyId, signerAddress } =
          await webAuthnService.createOrGetWebAuthnOwner(
            this.jwtToken,
            this.chainId,
            this.provider,
            this.API,
            walletAddress
          )
        this.signer = new WebAuthnSigner(publicKeyId, signerAddress)
      } catch (err) {
        console.log(err)
        return
      }
    }

    if (!walletAddress) {
      const ownerAddress = await this.getAccount()
      if (!ownerAddress) throw new Error('No owner address found')
      await this.API.initWalletForUserID({ token: this.jwtToken, ownerAddress })
    }
  }

  async createOrGetBurnerWallet(walletAddress: string): Promise<void> {
    const currentPrivateKey = window.localStorage.getItem('custom-auth-connect')

    if (!walletAddress) {
      this.signer = ethers.Wallet.createRandom()
      window.localStorage.setItem('custom-auth-connect', this.signer.privateKey)
      return
    }

    if (currentPrivateKey) {
      const storageSigner = new ethers.Wallet(currentPrivateKey)

      const isDeployed = await safeService.isDeployed(
        walletAddress,
        this.provider
      )

      if (isDeployed) {
        const isSafeOwner = await safeService.isSafeOwner(
          walletAddress,
          storageSigner.address,
          this.provider
        )

        if (!isSafeOwner)
          throw new Error(
            'New Domain detected. You need to add that domain as signer'
          )
      } else {
        const predictedWalletAddress = await this.API.getWalletAddress(
          storageSigner.address
        )

        if (predictedWalletAddress !== walletAddress)
          throw new Error(
            'New Domain detected. You need to add that domain as signer'
          )
      }

      this.signer = storageSigner
      return
    } else {
      throw new Error(
        'New Domain detected. You need to add that domain as signer'
      )
    }
  }

  async logout(): Promise<void> {
    if (!this.signer) throw new Error('No Wallet instance found')
    this.signer = undefined
  }

  async getAccount(): Promise<string> {
    if (!this.signer) throw new Error('No Wallet instance found')
    return this.signer.getAddress()
  }

  getSigner(): Wallet | WebAuthnSigner {
    if (!this.signer) throw new Error('No Wallet instance found')
    return this.signer
  }

  async getWalletAddress(): Promise<string> {
    const ownerAddress = await this.getAccount()
    if (!ownerAddress) throw new Error('No owner address found')
    const walletAddress = await this.API.getWalletAddress(ownerAddress)
    return walletAddress
  }

  async getUserInfos(): Promise<Partial<UserInfos>> {
    return { walletAddress: await this.getAccount() } ?? {}
  }
}
