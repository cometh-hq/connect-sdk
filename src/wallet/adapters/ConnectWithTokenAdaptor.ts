import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { ethers, Wallet } from 'ethers'

import { networks } from '../../constants'
import { API } from '../../services'
import burnerWalletService from '../../services/burnerWalletService'
import deviceService from '../../services/deviceService'
import tokenService from '../../services/tokenService'
import webAuthnService from '../../services/webAuthnService'
import { WebAuthnSigner } from '../signers/WebAuthnSigner'
import {
  NewSignerObject,
  NewSignerRequest,
  NewSignerRequestType,
  SupportedNetworks,
  UserInfos
} from '../types'
import { AUTHAdapter } from './types'

export interface ConnectWithTokenAdaptorConfig {
  chainId: SupportedNetworks
  jwtToken: string
  apiKey: string
  userName?: string
  rpcUrl?: string
  baseUrl?: string
}

export class ConnectWithTokenAdaptor implements AUTHAdapter {
  private signer?: WebAuthnSigner | Wallet
  readonly chainId: SupportedNetworks
  private API: API
  private jwtToken: string
  private provider: StaticJsonRpcProvider
  private userName?: string

  constructor({
    chainId,
    jwtToken,
    apiKey,
    userName,
    rpcUrl,
    baseUrl
  }: ConnectWithTokenAdaptorConfig) {
    this.chainId = chainId
    this.jwtToken = jwtToken
    this.userName = userName
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

    const decodedToken = tokenService.decodeToken(this.jwtToken)
    const userId = decodedToken?.payload.sub

    if (!isWebAuthnCompatible) {
      this.signer = walletAddress
        ? await burnerWalletService.getSignerForUserId(
            userId,
            this.API,
            this.provider,
            walletAddress
          )
        : await burnerWalletService.createSignerAndWalletForUserId(
            this.jwtToken,
            userId,
            this.API
          )
    } else {
      try {
        const { publicKeyId, signerAddress } = walletAddress
          ? await webAuthnService.getSignerForUserId(
              walletAddress,
              userId,
              this.API
            )
          : await webAuthnService.createSignerAndWalletForUserId(
              this.jwtToken,
              userId,
              this.API,
              this.userName
            )

        this.signer = new WebAuthnSigner(publicKeyId, signerAddress)
      } catch {
        throw new Error(
          'New Domain detected. You need to add that domain as signer.'
        )
      }
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
    return await this.API.getWalletAddressFromUserID(this.jwtToken)
  }

  async getUserInfos(): Promise<Partial<UserInfos>> {
    return { walletAddress: await this.getAccount() } ?? {}
  }

  public async createNewSignerObject(
    walletAddress: string,
    userName?: string
  ): Promise<NewSignerObject> {
    const isWebAuthnCompatible = await webAuthnService.isWebAuthnCompatible()

    let addNewSignerRequest: NewSignerObject

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

  public async createNewSignerRequest(userName?: string): Promise<void> {
    const walletAddress = await this.API.getWalletAddressFromUserID(
      this.jwtToken
    )

    const addNewSignerRequest = await this.createNewSignerObject(
      walletAddress,
      userName
    )

    await this.API.createNewSignerRequest({
      token: this.jwtToken,
      ...addNewSignerRequest
    })
  }

  public async getNewSignerRequestByUser(): Promise<NewSignerRequest[] | null> {
    return await this.API.getNewSignerRequestByUser(this.jwtToken)
  }

  public async deleteNewSignerRequest(signerAddress: string): Promise<void> {
    return await this.API.deleteNewSignerRequest({
      token: this.jwtToken,
      signerAddress
    })
  }

  public async deployWebAuthnSigner(
    newSignerRequest: NewSignerRequest
  ): Promise<string> {
    if (!newSignerRequest.publicKeyId) throw new Error('publicKeyId not valid')
    if (!newSignerRequest.publicKeyX) throw new Error('publicKeyX not valid')
    if (!newSignerRequest.publicKeyY) throw new Error('publicKeyY not valid')

    return await this.API.deployWebAuthnSigner({
      token: this.jwtToken,
      walletAddress: newSignerRequest.walletAddress,
      publicKeyId: newSignerRequest.publicKeyId,
      publicKeyX: newSignerRequest.publicKeyX,
      publicKeyY: newSignerRequest.publicKeyY,
      deviceData: newSignerRequest.deviceData
    })
  }
}
