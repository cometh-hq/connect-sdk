import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from 'ethers'
import { isAddress } from 'ethers/lib/utils'

import {
  DEFAULT_WEBAUTHN_OPTIONS,
  importSafeMessage,
  networks
} from '../../constants'
import { API } from '../../services'
import deviceService from '../../services/deviceService'
import eoaFallbackService from '../../services/eoaFallbackService'
import safeService from '../../services/safeService'
import webAuthnService from '../../services/webAuthnService'
import { WebAuthnSigner } from '../signers/WebAuthnSigner'
import {
  NewSignerRequest,
  NewSignerRequestBody,
  NewSignerRequestType,
  SupportedNetworks,
  WalletInfos,
  webAuthnOptions
} from '../types'
import { AUTHAdapter } from './types'

export interface ConnectAdaptorConfig {
  chainId: SupportedNetworks
  apiKey: string
  disableEoaFallback?: boolean
  encryptionSalt?: string
  webAuthnOptions?: webAuthnOptions
  passKeyName?: string
  rpcUrl?: string
  baseUrl?: string
}

export class ConnectAdaptor implements AUTHAdapter {
  private disableEoaFallback: boolean
  private webAuthnOptions: webAuthnOptions
  private encryptionSalt?: string
  private signer?: WebAuthnSigner | Wallet
  readonly chainId: SupportedNetworks
  private API: API
  private provider: StaticJsonRpcProvider
  private walletAddress?: string
  private passKeyName?: string

  constructor({
    chainId,
    apiKey,
    disableEoaFallback = false,
    encryptionSalt,
    passKeyName,
    webAuthnOptions,
    rpcUrl,
    baseUrl
  }: ConnectAdaptorConfig) {
    this.disableEoaFallback = disableEoaFallback
    this.encryptionSalt = encryptionSalt
    this.chainId = chainId
    this.API = new API(apiKey, baseUrl)
    this.provider = new StaticJsonRpcProvider(
      rpcUrl ?? networks[+this.chainId].RPCUrl
    )
    this.passKeyName = passKeyName
    this.webAuthnOptions = webAuthnOptions || DEFAULT_WEBAUTHN_OPTIONS
  }

  async connect(walletAddress?: string): Promise<void> {
    const isWebAuthnCompatible = await webAuthnService.isWebAuthnCompatible(
      this.webAuthnOptions
    )

    if (walletAddress) {
      await this._reconnect(walletAddress, isWebAuthnCompatible)
    } else {
      await this._createWallet(isWebAuthnCompatible)
    }
  }

  private async _reconnect(
    walletAddress: string,
    isWebAuthnCompatible: boolean
  ): Promise<void> {
    const wallet = await this.getWalletInfos(walletAddress)
    if (!wallet) throw new Error('Wallet does not exists')

    const eoaFallbackSigner = Object.keys(localStorage).find((key) =>
      key.startsWith('cometh-connect-fallback-')
    )

    if (isWebAuthnCompatible && !eoaFallbackSigner) {
      const { publicKeyId, signerAddress } = await webAuthnService.getSigner({
        API: this.API,
        walletAddress,
        provider: this.provider
      })
      this.signer = new WebAuthnSigner(publicKeyId, signerAddress)
    } else {
      this._throwErrorWhenEoaFallbackDisabled()
      this.signer = await eoaFallbackService.getSigner({
        API: this.API,
        provider: this.provider,
        walletAddress,
        encryptionSalt: this.encryptionSalt
      })
    }

    this.walletAddress = walletAddress
  }

  private async _createWallet(isWebAuthnCompatible: boolean): Promise<void> {
    if (isWebAuthnCompatible) {
      await this._createWalletWithPasskeySigner()
    } else {
      await this._createWalletWithFallbackSigner()
    }
  }

  private async _createWalletWithPasskeySigner(): Promise<void> {
    const {
      walletAddress,
      publicKeyId,
      signerAddress,
      publicKeyX,
      publicKeyY,
      deviceData,
      publicKeyAlgorithm
    } = await webAuthnService.createSigner({
      API: this.API,
      webAuthnOptions: this.webAuthnOptions,
      passKeyName: this.passKeyName
    })

    if (publicKeyAlgorithm === -257) {
      await this._createWalletWithFallbackSigner()
    } else {
      if (!walletAddress || !signerAddress)
        throw new Error('Error in webauthn creation')

      webAuthnService.setWebauthnCredentialsInStorage(
        walletAddress,
        publicKeyId,
        signerAddress
      )

      this.signer = new WebAuthnSigner(publicKeyId, signerAddress)
      this.walletAddress = walletAddress

      await this.API.initWalletWithWebAuthn({
        walletAddress,
        publicKeyId,
        publicKeyX,
        publicKeyY,
        deviceData
      })
    }
  }

  private async _createWalletWithFallbackSigner(): Promise<void> {
    this._throwErrorWhenEoaFallbackDisabled()

    const { signer, walletAddress } = await eoaFallbackService.createSigner({
      API: this.API,
      encryptionSalt: this.encryptionSalt
    })

    this.signer = signer
    this.walletAddress = walletAddress

    await this.API.initWallet({
      ownerAddress: signer.address
    })
  }

  _throwErrorWhenEoaFallbackDisabled(): void {
    if (this.disableEoaFallback)
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

      const isWebAuthnCompatible = await webAuthnService.isWebAuthnCompatible(
        this.webAuthnOptions
      )

      if (!isWebAuthnCompatible) {
        const { signer } = await eoaFallbackService.createSigner({
          API: this.API,
          walletAddress
        })
        requestBody = { signerAddress: signer.address }
      } else {
        try {
          requestBody = await webAuthnService.createSigner({
            API: this.API,
            walletAddress,
            webAuthnOptions: this.webAuthnOptions
          })

          webAuthnService.setWebauthnCredentialsInStorage(
            walletAddress,
            requestBody.publicKeyId,
            requestBody.signerAddress
          )
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
    if (!isAddress(walletAddress)) {
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
    passKeyName?: string
  ): Promise<NewSignerRequestBody> {
    const { addNewSignerRequest, localPrivateKey } =
      await this.createSignerObject(walletAddress, passKeyName)

    if (addNewSignerRequest.type === NewSignerRequestType.WEBAUTHN) {
      webAuthnService.setWebauthnCredentialsInStorage(
        walletAddress,
        addNewSignerRequest.publicKeyId!,
        addNewSignerRequest.signerAddress!
      )
    } else {
      window.localStorage.setItem(
        `cometh-connect-${walletAddress}`,
        localPrivateKey!
      )
    }

    return addNewSignerRequest
  }

  async initRecoveryRequest(
    walletAddress: string,
    passKeyName?: string
  ): Promise<NewSignerRequestBody> {
    const { addNewSignerRequest } = await this.createSignerObject(
      walletAddress,
      passKeyName
    )

    return addNewSignerRequest
  }

  private async createSignerObject(
    walletAddress: string,
    passKeyName?: string
  ): Promise<{
    addNewSignerRequest: NewSignerRequestBody
    localPrivateKey?: string
  }> {
    const isWebAuthnCompatible = await webAuthnService.isWebAuthnCompatible(
      this.webAuthnOptions
    )

    let addNewSignerRequest
    let localPrivateKey

    if (isWebAuthnCompatible) {
      const { publicKeyX, publicKeyY, publicKeyId, signerAddress, deviceData } =
        await webAuthnService.createSigner({
          API: this.API,
          walletAddress,
          webAuthnOptions: this.webAuthnOptions,
          passKeyName
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
      this.signer = Wallet.createRandom()
      localPrivateKey = this.signer.privateKey

      addNewSignerRequest = {
        walletAddress,
        signerAddress: this.signer?.address,
        deviceData: deviceService.getDeviceData(),
        type: NewSignerRequestType.BURNER_WALLET
      }
    }

    return { addNewSignerRequest, localPrivateKey }
  }

  async getNewSignerRequests(): Promise<NewSignerRequest[] | null> {
    const walletAddress = this.getWalletAddress()
    return await this.API.getNewSignerRequests(walletAddress)
  }

  async waitWebAuthnSignerDeployment(publicKeyId: string): Promise<void> {
    const webAuthnSigner = await this.API.getWebAuthnSignerByPublicKeyId(
      publicKeyId
    )

    await webAuthnService.waitWebAuthnSignerDeployment(
      webAuthnSigner.deploymentParams.P256FactoryContract,
      webAuthnSigner.publicKeyX,
      webAuthnSigner.publicKeyY,
      this.provider
    )
  }
}
