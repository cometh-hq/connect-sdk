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
  NewSignerRequest,
  NewSignerRequestBody,
  NewSignerRequestType,
  ProjectParams,
  SupportedNetworks,
  UserInfos
} from '../types'
import { AUTHAdapter } from './types'

export interface ConnectWithJwtAdaptorConfig {
  chainId: SupportedNetworks
  jwtToken: string
  apiKey: string
  userName?: string
  rpcUrl?: string
  baseUrl?: string
}

export class ConnectWithJwtAdaptor implements AUTHAdapter {
  private signer?: WebAuthnSigner | Wallet
  readonly chainId: SupportedNetworks
  private API: API
  private jwtToken: string
  private provider: StaticJsonRpcProvider
  private walletAddress?: string
  private userName?: string
  private projectParams?: ProjectParams

  constructor({
    chainId,
    jwtToken,
    apiKey,
    userName,
    rpcUrl,
    baseUrl
  }: ConnectWithJwtAdaptorConfig) {
    this.chainId = chainId
    this.jwtToken = jwtToken
    this.userName = userName
    this.API = new API(apiKey, +chainId, baseUrl)
    this.provider = new StaticJsonRpcProvider(
      rpcUrl ? rpcUrl : networks[+this.chainId].RPCUrl
    )
  }

  async connect(): Promise<void> {
    this.projectParams = await this.API.getProjectParams()

    this.walletAddress = await this.API.getWalletAddressFromUserID(
      this.jwtToken
    )
    const decodedToken = tokenService.decodeToken(this.jwtToken)
    const userId = decodedToken?.payload.sub

    const isWebAuthnCompatible = await webAuthnService.isWebAuthnCompatible()

    if (this.walletAddress) {
      if (isWebAuthnCompatible) {
        const { publicKeyId, signerAddress } = await webAuthnService.getSigner({
          API: this.API,
          walletAddress: this.walletAddress,
          userId
        })
        this.signer = new WebAuthnSigner(publicKeyId, signerAddress)
      } else {
        await burnerWalletService.getSigner({
          API: this.API,
          provider: this.provider,
          walletAddress: this.walletAddress,
          userId
        })
      }
    } else {
      if (isWebAuthnCompatible) {
        const {
          publicKeyX,
          publicKeyY,
          publicKeyId,
          signerAddress,
          deviceData,
          walletAddress
        } = await webAuthnService.createSigner({
          API: this.API,
          userName: this.userName,
          userId
        })

        await this.API.initWalletWithWebAuthnForUserID({
          token: this.jwtToken,
          walletAddress,
          publicKeyId,
          publicKeyX,
          publicKeyY,
          deviceData
        })

        this.signer = new WebAuthnSigner(publicKeyId, signerAddress)
      } else {
        ;({ signer: this.signer } = await burnerWalletService.createSigner({
          API: this.API,
          token: this.jwtToken,
          userId
        }))

        await this.API.initWalletForUserID({
          token: this.jwtToken,
          ownerAddress: await this.signer.getAddress()
        })
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

  getWalletAddress(): string {
    if (!this.walletAddress) throw new Error('No wallet instance found')
    return this.walletAddress
  }

  async getUserInfos(): Promise<Partial<UserInfos>> {
    return { walletAddress: await this.getAccount() } ?? {}
  }

  async initNewSignerRequest(
    walletAddress: string,
    userName?: string
  ): Promise<NewSignerRequestBody> {
    const decodedToken = tokenService.decodeToken(this.jwtToken)
    const userId = decodedToken?.payload.sub
    if (!userId) throw new Error('No userId found')

    const isWebAuthnCompatible = await webAuthnService.isWebAuthnCompatible()

    let addNewSignerRequest: NewSignerRequestBody

    if (isWebAuthnCompatible) {
      const { publicKeyX, publicKeyY, publicKeyId, signerAddress, deviceData } =
        await webAuthnService.createSigner({
          API: this.API,
          userName,
          userId
        })

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
        `cometh-connect-${userId}`,
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

  async createNewSignerRequest(userName?: string): Promise<void> {
    const walletAddress = await this.API.getWalletAddressFromUserID(
      this.jwtToken
    )

    const addNewSignerRequest = await this.initNewSignerRequest(
      walletAddress,
      userName
    )

    await this.API.createNewSignerRequest({
      token: this.jwtToken,
      ...addNewSignerRequest
    })
  }

  async getNewSignerRequests(): Promise<NewSignerRequest[] | null> {
    const walletAddress = await this.getWalletAddress()
    return await this.API.getNewSignerRequests(walletAddress)
  }

  async deleteNewSignerRequest(signerAddress: string): Promise<void> {
    return await this.API.deleteNewSignerRequest({
      token: this.jwtToken,
      signerAddress
    })
  }

  async validateNewSignerRequest(
    newSignerRequest: NewSignerRequest
  ): Promise<string> {
    if (!this.projectParams) throw new Error('Project params are null')

    await this.deleteNewSignerRequest(newSignerRequest.signerAddress)

    if (newSignerRequest.type === NewSignerRequestType.WEBAUTHN) {
      if (!newSignerRequest.publicKeyId)
        throw new Error('publicKeyId not valid')
      if (!newSignerRequest.publicKeyX) throw new Error('publicKeyX not valid')
      if (!newSignerRequest.publicKeyY) throw new Error('publicKeyY not valid')

      await this.API.deployWebAuthnSigner({
        token: this.jwtToken,
        walletAddress: newSignerRequest.walletAddress,
        publicKeyId: newSignerRequest.publicKeyId,
        publicKeyX: newSignerRequest.publicKeyX,
        publicKeyY: newSignerRequest.publicKeyY,
        deviceData: newSignerRequest.deviceData
      })

      await webAuthnService.waitWebAuthnSignerDeployment(
        this.projectParams.P256FactoryContractAddress,
        newSignerRequest.publicKeyX!,
        newSignerRequest.publicKeyY!,
        this.provider
      )
    }
    return newSignerRequest.signerAddress
  }
}
