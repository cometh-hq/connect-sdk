import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { ethers, Wallet } from 'ethers'

import { networks } from '../../constants'
import { API } from '../../services'
import burnerWalletService from '../../services/burnerWalletService'
import deviceService from '../../services/deviceService'
import webAuthnService from '../../services/webAuthnService'
import { WebAuthnSigner } from '../signers/WebAuthnSigner'
import {
  NewSignerRequest,
  NewSignerRequestBody,
  NewSignerRequestType,
  SupportedNetworks,
  UserInfos
} from '../types'
import { AUTHAdapter } from './types'

export interface ConnectAdaptorConfig {
  chainId: SupportedNetworks
  apiKey: string
  userName?: string
  rpcUrl?: string
  baseUrl?: string
}

export class ConnectAdaptor implements AUTHAdapter {
  private signer?: WebAuthnSigner | Wallet
  readonly chainId: SupportedNetworks
  private API: API
  private provider: StaticJsonRpcProvider
  private walletAddress?: string
  private userName?: string

  constructor({
    chainId,
    apiKey,
    userName,
    rpcUrl,
    baseUrl
  }: ConnectAdaptorConfig) {
    this.chainId = chainId
    this.userName = userName
    this.API = new API(apiKey, +chainId, baseUrl)
    this.provider = new StaticJsonRpcProvider(
      rpcUrl ? rpcUrl : networks[+this.chainId].RPCUrl
    )
  }

  async connect(walletAddress?: string): Promise<void> {
    if (walletAddress) await this._verifywalletAddress(walletAddress)

    const isWebAuthnCompatible = await webAuthnService.isWebAuthnCompatible()

    if (!isWebAuthnCompatible) {
      this.signer = walletAddress
        ? await burnerWalletService.getSigner(
            this.API,
            this.provider,
            walletAddress
          )
        : await burnerWalletService.createSignerAndWallet(this.API)
    } else {
      try {
        const { publicKeyId, signerAddress } = walletAddress
          ? await webAuthnService.getSigner(this.API, walletAddress)
          : await webAuthnService.createSignerAndWallet(this.API, this.userName)

        this.signer = new WebAuthnSigner(publicKeyId, signerAddress)
      } catch {
        throw new Error(
          'New Domain detected. You need to add that domain as signer.'
        )
      }
    }

    this.walletAddress = walletAddress
      ? walletAddress
      : await this.API.getWalletAddress(await this.signer.getAddress())
  }

  async _verifywalletAddress(walletAddress: string): Promise<void> {
    let connectWallet
    try {
      connectWallet = await this.API.getWalletInfos(walletAddress)
    } catch {
      throw new Error('Invalid address format')
    }
    if (!connectWallet) throw new Error('Wallet does not exist')
  }

  async logout(): Promise<void> {
    if (!this.signer) throw new Error('No signer instance found')
    this.signer = undefined
  }

  async getAccount(): Promise<string> {
    if (!this.signer) throw new Error('No signer instance found')
    return this.signer.getAddress()
  }

  getSigner(): Wallet | WebAuthnSigner {
    if (!this.signer) throw new Error('No signer instance found')
    return this.signer
  }

  async getWalletAddress(): Promise<string> {
    if (!this.walletAddress) throw new Error('No wallet instance found')
    return this.walletAddress
  }

  async getUserInfos(): Promise<Partial<UserInfos>> {
    return { walletAddress: await this.getAccount() } ?? {}
  }

  public async createNewSignerRequest(
    walletAddress: string,
    userName?: string
  ): Promise<NewSignerRequestBody> {
    const isWebAuthnCompatible = await webAuthnService.isWebAuthnCompatible()

    let addNewSignerRequest

    if (isWebAuthnCompatible) {
      const { publicKeyX, publicKeyY, publicKeyId, signerAddress, deviceData } =
        await webAuthnService.createWebAuthnSigner(this.API, userName)

      addNewSignerRequest = {
        walletAddress,
        signerAddress,
        deviceData,
        type: NewSignerRequestType.WEBAUTHN,
        publicKeyId,
        publicKeyX,
        publicKeyY
      }
    } else {
      this.signer = ethers.Wallet.createRandom()
      window.localStorage.setItem(
        `cometh-connect-${walletAddress}`,
        this.signer.privateKey
      )

      addNewSignerRequest = {
        walletAddress,
        signerAddress: this.signer?.address,
        deviceData: deviceService.getDeviceData(),
        type: NewSignerRequestType.BURNER_WALLET
      }
    }

    return addNewSignerRequest
  }

  public async getNewSignerRequestsByWallet(): Promise<
    NewSignerRequest[] | null
  > {
    const walletAddress = await this.getWalletAddress()
    return await this.API.getNewSignerRequestByUser(walletAddress)
  }

  public async createNewSignerRequestByToken(): Promise<void> {
    throw new Error('Not authorized method: createNewSignerRequestByToken')
  }

  public async deleteNewSignerRequestByToken(
    signerAddress: string
  ): Promise<void> {
    throw new Error('Not authorized method: deleteNewSignerRequestByToken')
  }

  public async deployWebAuthnSignerByToken(
    newSignerRequest: NewSignerRequest
  ): Promise<string> {
    throw new Error('Not authorized method: deployWebAuthnSignerByToken')
  }
}
