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
  ProjectParams
} from '../types'
import { AUTHAdapter } from './types'

export interface ConnectWithJwtAdaptorConfig {
  jwtToken: string
  apiKey: string
  disableLocal?: boolean
  passkeyName?: string
  rpcUrl?: string
  baseUrl?: string
}

export class ConnectWithJwtAdaptor implements AUTHAdapter {
  private signer?: WebAuthnSigner | Wallet
  private disableLocal: boolean
  public chainId?: string
  private rpcUrl?: string
  private API: API
  private jwtToken: string
  private provider?: StaticJsonRpcProvider
  private walletAddress?: string
  private passkeyName?: string
  private projectParams?: ProjectParams

  constructor({
    jwtToken,
    apiKey,
    disableLocal = false,
    passkeyName,
    rpcUrl,
    baseUrl
  }: ConnectWithJwtAdaptorConfig) {
    this.jwtToken = jwtToken
    this.disableLocal = disableLocal
    this.passkeyName = passkeyName
    this.API = new API(apiKey, baseUrl)
    this.rpcUrl = rpcUrl
  }

  async initialize(): Promise<void> {
    this.projectParams = await this.API.getProjectParams()
    this.chainId = this.projectParams.chainId
    this.provider = new StaticJsonRpcProvider(
      this.rpcUrl ?? networks[+this.chainId].RPCUrl
    )
  }

  async connect(): Promise<void> {
    if (!this.provider) throw new Error('adaptor not initialized yet')

    this.walletAddress = await this.API.getWalletAddressFromUserID(
      this.jwtToken
    )

    const isWebAuthnCompatible = await webAuthnService.isWebAuthnCompatible()

    if (this.walletAddress) {
      if (isWebAuthnCompatible) {
        const { publicKeyId, signerAddress } = await webAuthnService.getSigner({
          API: this.API,
          walletAddress: this.walletAddress,
          provider: this.provider
        })
        this.signer = new WebAuthnSigner(publicKeyId, signerAddress)
      } else {
        this._isLocalDisable()

        await burnerWalletService.getSigner({
          API: this.API,
          provider: this.provider,
          walletAddress: this.walletAddress
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
          passkeyName: this.passkeyName
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
        this.walletAddress = walletAddress
      } else {
        this._isLocalDisable()

        const { signer, walletAddress } =
          await burnerWalletService.createSigner({
            API: this.API
          })

        this.signer = signer
        this.walletAddress = walletAddress

        await this.API.initWalletForUserID({
          token: this.jwtToken,
          ownerAddress: signer.address
        })
      }
    }
  }

  _isLocalDisable(): void {
    if (this.disableLocal)
      throw new Error('Passkeys are not compatible with your device')
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

  async initNewSignerRequest(
    walletAddress: string,
    passkeyName?: string
  ): Promise<NewSignerRequestBody> {
    const isWebAuthnCompatible = await webAuthnService.isWebAuthnCompatible()

    let addNewSignerRequest: NewSignerRequestBody

    if (isWebAuthnCompatible) {
      const { publicKeyX, publicKeyY, publicKeyId, signerAddress, deviceData } =
        await webAuthnService.createSigner({
          API: this.API,
          passkeyName
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

  async createNewSignerRequest(passkeyName?: string): Promise<void> {
    const walletAddress = await this.API.getWalletAddressFromUserID(
      this.jwtToken
    )

    const addNewSignerRequest = await this.initNewSignerRequest(
      walletAddress,
      passkeyName
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
    if (!this.provider) throw new Error('adaptor not initialized yet')

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
