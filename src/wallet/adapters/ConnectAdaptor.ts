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
import {
  EoaFallbackDisableError,
  InvalidAddressFormatError,
  NoFallbackSignerError,
  NoSignerFoundError,
  PasskeyCreationError,
  SafeVersionError,
  WalletDoesNotExistsError,
  WalletNotConnectedError,
  WalletNotDeployedError,
  WrongSignedMessageError
} from '../errors'
import { WebAuthnSigner } from '../signers/WebAuthnSigner'
import {
  NewSignerRequest,
  NewSignerRequestBody,
  NewSignerRequestType,
  SupportedNetworks,
  WalletInfos,
  webAuthnOptions,
  webauthnStorageValues
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
    if (!wallet) throw new WalletDoesNotExistsError()

    if (isWebAuthnCompatible && !this._isFallbackSigner()) {
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
    const { publicKeyId, publicKeyX, publicKeyY, publicKeyAlgorithm } =
      await webAuthnService.createCredential(
        this.webAuthnOptions,
        this.passKeyName
      )

    if (publicKeyAlgorithm === -7) {
      const { walletAddress, signerAddress, deviceData } =
        await webAuthnService.getSignerFromCredentials({
          API: this.API,
          publicKeyX,
          publicKeyY
        })

      if (!walletAddress || !signerAddress) throw new PasskeyCreationError()

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
    } else {
      await this._createWalletWithFallbackSigner()
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
    if (this.disableEoaFallback) throw new EoaFallbackDisableError()
  }

  async retrieveWalletAddressFromSigner(): Promise<string> {
    return await webAuthnService.retrieveWalletAddressFromSigner(this.API)
  }

  async getCurrentSigner(): Promise<
    webauthnStorageValues | string | undefined
  > {
    if (!this.walletAddress) throw new WalletNotConnectedError()

    if (this._isFallbackSigner()) {
      const localSigner = await eoaFallbackService.getSignerLocalStorage(
        this.walletAddress,
        this.encryptionSalt
      )

      if (localSigner) return localSigner.address
    } else {
      const webauthnWallet = webAuthnService.getWebauthnCredentialsInStorage(
        this.walletAddress
      )

      if (webauthnWallet) return JSON.parse(webauthnWallet)
    }

    return undefined
  }

  private _isFallbackSigner(): boolean {
    const fallbackSigner = Object.keys(localStorage).find((key) =>
      key.startsWith('cometh-connect-fallback-')
    )
    return !!fallbackSigner
  }

  async importSafe(
    walletAddress: string,
    message: string,
    signature: string
  ): Promise<string> {
    if (message !== importSafeMessage) throw new WrongSignedMessageError()

    const safeVersion = await safeService.getSafeVersion(
      walletAddress,
      this.provider
    )
    if (safeVersion !== '1.3.0') throw new SafeVersionError()

    const isWebAuthnCompatible = await webAuthnService.isWebAuthnCompatible(
      this.webAuthnOptions
    )

    if (isWebAuthnCompatible) {
      const { publicKeyId, publicKeyX, publicKeyY, publicKeyAlgorithm } =
        await webAuthnService.createCredential(
          this.webAuthnOptions,
          this.passKeyName
        )

      if (publicKeyAlgorithm === -7) {
        const { signerAddress, deviceData } =
          await webAuthnService.getSignerFromCredentials({
            API: this.API,
            publicKeyX,
            publicKeyY
          })

        webAuthnService.setWebauthnCredentialsInStorage(
          walletAddress,
          publicKeyId,
          signerAddress
        )

        return await this.API.importExternalSafe({
          message,
          signature,
          walletAddress,
          signerAddress,
          deviceData,
          publicKeyId,
          publicKeyX,
          publicKeyY
        })
      }
    }

    const { signer } = await eoaFallbackService.createSigner({
      API: this.API,
      walletAddress
    })

    return await this.API.importExternalSafe({
      message,
      signature,
      walletAddress,
      signerAddress: signer.address,
      deviceData: deviceService.getDeviceData()
    })
  }

  getImportSafeMessage(): string {
    return importSafeMessage
  }

  async getWalletInfos(walletAddress: string): Promise<WalletInfos> {
    if (!isAddress(walletAddress)) {
      throw new InvalidAddressFormatError()
    }

    return await this.API.getWalletInfos(walletAddress)
  }

  async logout(): Promise<void> {
    if (!this.signer) throw new NoSignerFoundError()
    this.signer = undefined
  }

  async getAccount(): Promise<string> {
    if (!this.signer) throw new NoSignerFoundError()
    return this.signer.getAddress()
  }

  getSigner(): Wallet | WebAuthnSigner {
    if (!this.signer) throw new NoSignerFoundError()
    return this.signer
  }

  getWalletAddress(): string {
    if (!this.walletAddress) throw new WalletNotConnectedError()
    return this.walletAddress
  }

  async initNewSignerRequest(
    walletAddress: string,
    passKeyName?: string
  ): Promise<NewSignerRequestBody> {
    const wallet = await this.getWalletInfos(walletAddress)

    if (!wallet) throw new WalletDoesNotExistsError()

    const { addNewSignerRequest, localPrivateKey } =
      await this.createSignerObject(walletAddress, passKeyName)

    if (addNewSignerRequest.type === NewSignerRequestType.WEBAUTHN) {
      webAuthnService.setWebauthnCredentialsInStorage(
        walletAddress,
        addNewSignerRequest.publicKeyId!,
        addNewSignerRequest.signerAddress!
      )
    } else {
      if (!localPrivateKey) throw new NoFallbackSignerError()

      eoaFallbackService.setSignerLocalStorage(
        walletAddress,
        new Wallet(localPrivateKey),
        this.encryptionSalt
      )
    }

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

    if (isWebAuthnCompatible && !this._isFallbackSigner()) {
      const { publicKeyId, publicKeyX, publicKeyY, publicKeyAlgorithm } =
        await webAuthnService.createCredential(
          this.webAuthnOptions,
          passKeyName
        )

      if (publicKeyAlgorithm === -7) {
        const { signerAddress, deviceData } =
          await webAuthnService.getSignerFromCredentials({
            API: this.API,
            publicKeyX,
            publicKeyY
          })

        return {
          addNewSignerRequest: {
            walletAddress,
            signerAddress,
            deviceData,
            type: NewSignerRequestType.WEBAUTHN,
            publicKeyId,
            publicKeyX,
            publicKeyY
          }
        }
      }
    }

    this.signer = Wallet.createRandom()

    return {
      addNewSignerRequest: {
        walletAddress,
        signerAddress: this.signer.address,
        deviceData: deviceService.getDeviceData(),
        type: NewSignerRequestType.BURNER_WALLET
      },
      localPrivateKey: this.signer.privateKey
    }
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

  async initRecoveryRequest(
    walletAddress: string,
    passKeyName?: string
  ): Promise<NewSignerRequestBody> {
    const isDeployed = await safeService.isDeployed(
      walletAddress,
      this.provider
    )
    if (!isDeployed) throw new WalletNotDeployedError()

    return this.initNewSignerRequest(walletAddress, passKeyName)
  }
}
