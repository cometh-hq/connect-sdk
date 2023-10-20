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
  ProjectParams,
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
  private projectParams?: ProjectParams

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

  async _verifywalletAddress(walletAddress: string): Promise<void> {
    let connectWallet
    try {
      connectWallet = await this.API.getWalletInfos(walletAddress)
    } catch {
      throw new Error('Invalid address format')
    }
    if (!connectWallet) throw new Error('Wallet does not exist')
  }

  async connect(walletAddress?: string): Promise<void> {
    this.projectParams = await this.API.getProjectParams()

    const isWebAuthnCompatible = await webAuthnService.isWebAuthnCompatible()

    if (walletAddress) {
      await this._verifywalletAddress(walletAddress)

      if (isWebAuthnCompatible) {
        const { publicKeyId, signerAddress } = await webAuthnService.getSigner({
          API: this.API,
          walletAddress
        })
        this.signer = new WebAuthnSigner(publicKeyId, signerAddress)
      } else {
        this.signer = await burnerWalletService.getSigner({
          API: this.API,
          provider: this.provider,
          walletAddress
        })
      }

      this.walletAddress = walletAddress
    } else {
      if (isWebAuthnCompatible) {
        const { publicKeyId, signerAddress } =
          await webAuthnService.createSignerAndWallet({
            API: this.API,
            userName: this.userName
          })

        this.signer = new WebAuthnSigner(publicKeyId, signerAddress)
      } else {
        this.signer = await burnerWalletService.createSignerAndWallet({
          API: this.API
        })
      }
      this.walletAddress = await this.API.getWalletAddress(
        await this.signer.getAddress()
      )
    }
  }

  public async connectWithExternalSafe(
    walletAddress: string,
    signature: string
  ): Promise<string> {
    let signerPayload

    const isWebAuthnCompatible = await webAuthnService.isWebAuthnCompatible()

    if (!isWebAuthnCompatible) {
      const signer = await burnerWalletService.createSignerAndWallet({
        API: this.API,
        walletAddress
      })
      signerPayload = { signerAddress: signer.address }
    } else {
      try {
        signerPayload = await webAuthnService.createWebAuthnSigner({
          API: this.API,
          walletAddress,
          userName: this.userName
        })
      } catch {
        throw new Error('Error in webAuthn creation')
      }
    }

    await this.API.importExternalSafe({
      signature,
      walletAddress,
      signerAddress: signerPayload.signerAddress,
      deviceData: signerPayload.deviceData,
      publicKeyId: signerPayload.publicKeyId,
      publicKeyX: signerPayload.publicKeyX,
      publicKeyY: signerPayload.publicKeyY
    })

    return signerPayload.signerAddress
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

  public async initNewSignerRequest(
    walletAddress: string,
    userName?: string
  ): Promise<NewSignerRequestBody> {
    const isWebAuthnCompatible = await webAuthnService.isWebAuthnCompatible()

    let addNewSignerRequest

    if (isWebAuthnCompatible) {
      const { publicKeyX, publicKeyY, publicKeyId, signerAddress, deviceData } =
        await webAuthnService.createWebAuthnSigner({ API: this.API, userName })

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

  public async getNewSignerRequests(): Promise<NewSignerRequest[] | null> {
    const walletAddress = await this.getWalletAddress()
    return await this.API.getNewSignerRequests(walletAddress)
  }

  public async waitWebAuthnSignerDeployment(
    publicKey_X: string,
    publicKey_Y: string
  ): Promise<void> {
    if (!this.projectParams) throw new Error('No project Params found')

    await webAuthnService.waitWebAuthnSignerDeployment(
      this.projectParams.P256FactoryContractAddress,
      publicKey_X,
      publicKey_Y,
      this.provider
    )
  }
}
