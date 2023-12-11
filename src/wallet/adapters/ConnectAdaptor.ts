import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { ethers, Wallet } from 'ethers'

import { importSafeMessage, networks } from '../../constants'
import { API } from '../../services'
import burnerWalletService from '../../services/burnerWalletService'
import deviceService from '../../services/deviceService'
import safeService from '../../services/safeService'
import webAuthnService from '../../services/webAuthnService'
import { WebAuthnSigner } from '../signers/WebAuthnSigner'
import {
  NewSignerRequest,
  NewSignerRequestBody,
  NewSignerRequestType,
  ProjectParams,
  WalletInfos
} from '../types'
import { AUTHAdapter } from './types'

export interface ConnectAdaptorConfig {
  apiKey: string
  disableLocal?: boolean
  passkeyName?: string
  rpcUrl?: string
  baseUrl?: string
}

export class ConnectAdaptor implements AUTHAdapter {
  private disableLocal: boolean
  private API: API
  private signer?: WebAuthnSigner | Wallet
  public chainId?: string
  private rpcUrl?: string
  private provider?: StaticJsonRpcProvider
  private walletAddress?: string
  private passkeyName?: string
  private projectParams?: ProjectParams

  constructor({
    apiKey,
    disableLocal = false,
    passkeyName,
    rpcUrl,
    baseUrl
  }: ConnectAdaptorConfig) {
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

  async connect(walletAddress?: string): Promise<void> {
    if (!this.provider) throw new Error('adaptor not initialized yet')

    const isWebAuthnCompatible = await webAuthnService.isWebAuthnCompatible()

    if (walletAddress) {
      const wallet = await this.getWalletInfos(walletAddress)

      if (!wallet) throw new Error('Wallet does not exists')

      if (isWebAuthnCompatible) {
        const { publicKeyId, signerAddress } = await webAuthnService.getSigner({
          API: this.API,
          walletAddress,
          provider: this.provider
        })
        this.signer = new WebAuthnSigner(publicKeyId, signerAddress)
      } else {
        this._isLocalDisable()

        this.signer = await burnerWalletService.getSigner({
          API: this.API,
          provider: this.provider,
          walletAddress
        })
      }

      this.walletAddress = walletAddress
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

        this.signer = new WebAuthnSigner(publicKeyId, signerAddress)
        this.walletAddress = walletAddress

        await this.API.initWalletWithWebAuthn({
          walletAddress,
          publicKeyId,
          publicKeyX,
          publicKeyY,
          deviceData
        })
      } else {
        this._isLocalDisable()

        const { signer, walletAddress } =
          await burnerWalletService.createSigner({
            API: this.API
          })

        this.signer = signer
        this.walletAddress = walletAddress

        await this.API.initWallet({
          ownerAddress: signer.address
        })
      }
    }
  }

  _isLocalDisable(): void {
    if (this.disableLocal)
      throw new Error('Passkeys are not compatible with your device')
  }

  async retrieveWalletAddressFromSigner(): Promise<string> {
    return await webAuthnService.retrieveWalletAddressFromSigner(this.API)
  }

  async importSafe(
    walletAddress: string,
    message: string,
    signature: string
  ): Promise<string> {
    if (!this.provider) throw new Error('adaptor not initialized yet')
    if (message !== importSafeMessage) throw new Error('Wrong message signed')

    const safeVersion = await safeService.getSafeVersion(
      walletAddress,
      this.provider
    )
    if (safeVersion !== '1.3.0') throw new Error('Safe version should be 1.3.0')

    const wallet = await this.getWalletInfos(walletAddress)

    if (wallet) {
      return wallet.initiatorAddress
    } else {
      let requestBody

      const isWebAuthnCompatible = await webAuthnService.isWebAuthnCompatible()

      if (!isWebAuthnCompatible) {
        const { signer } = await burnerWalletService.createSigner({
          API: this.API,
          walletAddress
        })
        requestBody = { signerAddress: signer.address }
      } else {
        try {
          requestBody = await webAuthnService.createSigner({
            API: this.API,
            walletAddress,
            passkeyName: this.passkeyName
          })
        } catch {
          throw new Error('Error in webAuthn creation')
        }
      }

      const signerAddress = await this.API.importExternalSafe({
        message,
        signature,
        walletAddress,
        signerAddress: requestBody.signerAddress,
        deviceData: requestBody.deviceData,
        publicKeyId: requestBody.publicKeyId,
        publicKeyX: requestBody.publicKeyX,
        publicKeyY: requestBody.publicKeyY
      })

      return signerAddress
    }
  }

  getImportSafeMessage(): string {
    return importSafeMessage
  }

  async getWalletInfos(walletAddress: string): Promise<WalletInfos> {
    if (!ethers.utils.isAddress(walletAddress)) {
      throw new Error('Invalid address format')
    }

    return await this.API.getWalletInfos(walletAddress)
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

  getWalletAddress(): string {
    if (!this.walletAddress) throw new Error('No wallet instance found')
    return this.walletAddress
  }

  async initNewSignerRequest(
    walletAddress: string,
    passkeyName?: string
  ): Promise<NewSignerRequestBody> {
    const isWebAuthnCompatible = await webAuthnService.isWebAuthnCompatible()

    let addNewSignerRequest

    if (isWebAuthnCompatible) {
      const { publicKeyX, publicKeyY, publicKeyId, signerAddress, deviceData } =
        await webAuthnService.createSigner({
          API: this.API,
          walletAddress,
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

  async getNewSignerRequests(): Promise<NewSignerRequest[] | null> {
    const walletAddress = this.getWalletAddress()
    return await this.API.getNewSignerRequests(walletAddress)
  }

  async waitWebAuthnSignerDeployment(
    publicKey_X: string,
    publicKey_Y: string
  ): Promise<void> {
    if (!this.provider) throw new Error('adaptor not initialized yet')
    if (!this.projectParams) throw new Error('No project Params found')

    await webAuthnService.waitWebAuthnSignerDeployment(
      this.projectParams.P256FactoryContractAddress,
      publicKey_X,
      publicKey_Y,
      this.provider
    )
  }
}
