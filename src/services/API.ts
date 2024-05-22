import axios, { AxiosInstance } from 'axios'
import { BigNumber } from 'ethers'
import { SiweMessage } from 'siwe'

import { API_URL } from '../constants'
import {
  DeviceData,
  NewSignerRequest,
  NewSignerRequestType,
  ProjectParams,
  RelayedTransaction,
  RelayedTransactionDetails,
  RelayTransactionType,
  SponsoredTransaction,
  UserNonceType,
  WalletInfos,
  WebAuthnSigner
} from '../wallet/types'

export class API {
  private readonly api: AxiosInstance

  constructor(apiKey: string, baseUrl?: string) {
    this.api = axios.create({ baseURL: baseUrl || API_URL })
    this.api.defaults.headers.common['apikey'] = apiKey
  }

  async getProjectParams(): Promise<ProjectParams> {
    const response = await this.api.get(`/project/params`)
    return response?.data?.projectParams
  }

  async getNonce(walletAddress: string): Promise<UserNonceType> {
    const response = await this.api.get(
      `/wallets/${walletAddress}/connection-nonce`
    )
    return response?.data?.userNonce
  }

  async getWalletAddress(ownerAddress: string): Promise<string> {
    const response = await this.api.get(
      `/wallets/${ownerAddress}/wallet-address`
    )
    return response?.data?.walletAddress
  }

  async getWalletInfos(walletAddress: string): Promise<WalletInfos> {
    const response = await this.api.get(
      `/wallets/${walletAddress}/wallet-infos`
    )
    return response?.data?.walletInfos
  }

  async getSponsoredAddresses(): Promise<SponsoredTransaction[]> {
    const response = await this.api.get(`/sponsored-address`)

    return response?.data?.sponsoredAddresses
  }

  async connect({
    message,
    signature,
    walletAddress
  }: {
    message: SiweMessage
    signature: string
    walletAddress: string
  }): Promise<string> {
    const body = {
      message,
      signature,
      walletAddress
    }

    const response = await this.api.post(`/wallets/connect`, body)

    return response?.data.walletAddress
  }

  async relayTransaction({
    walletAddress,
    safeTxData,
    signatures
  }: RelayTransactionType): Promise<RelayedTransaction> {
    const body = {
      ...safeTxData,
      nonce: safeTxData?.nonce?.toString(),
      baseGas: safeTxData?.baseGas?.toString(),
      gasPrice: safeTxData?.gasPrice?.toString(),
      safeTxGas: safeTxData?.safeTxGas?.toString(),
      signatures
    }
    const response = await this.api.post(
      `/wallets/${walletAddress}/relay`,
      body
    )
    return {
      safeTxHash: response.data.safeTxHash,
      relayId: response.data.relayId
    }
  }

  async getRelayedTransaction(
    relayId: string
  ): Promise<RelayedTransactionDetails> {
    const response = await this.api.get(`/relayed-transactions/${relayId}`)
    return response.data.relayedTransaction
  }

  async initWallet({
    ownerAddress
  }: {
    ownerAddress: string
  }): Promise<string> {
    const body = {
      ownerAddress
    }

    const response = await this.api.post(`/wallets/init`, body)

    return response?.data.walletAddress
  }

  async initWalletWithWebAuthn({
    walletAddress,
    publicKeyId,
    publicKeyX,
    publicKeyY,
    deviceData
  }: {
    walletAddress: string
    publicKeyId: string
    publicKeyX: string
    publicKeyY: string
    deviceData: DeviceData
  }): Promise<void> {
    const body = {
      walletAddress,
      publicKeyId,
      publicKeyX,
      publicKeyY,
      deviceData
    }

    await this.api.post(`/wallets/init-with-webauthn`, body)
  }

  async importExternalSafe({
    message,
    signature,
    walletAddress,
    signerAddress,
    deviceData,
    publicKeyId,
    publicKeyX,
    publicKeyY
  }: {
    message: string
    signature: string
    walletAddress: string
    signerAddress: string
    deviceData: DeviceData
    publicKeyId?: string
    publicKeyX?: string
    publicKeyY?: string
  }): Promise<string> {
    const body = {
      message,
      signature,
      walletAddress,
      signerAddress,
      deviceData,
      publicKeyId,
      publicKeyX,
      publicKeyY
    }

    const response = await this.api.post(`/wallets/import`, body)

    return response?.data.signerAddress
  }

  /**
   * User Section
   */

  async initWalletForUserID({
    token,
    ownerAddress
  }: {
    token: string
    ownerAddress: string
  }): Promise<string> {
    const config = {
      headers: {
        token
      }
    }
    const body = {
      ownerAddress
    }

    const response = await this.api.post(`/user/init`, body, config)

    return response?.data.walletAddress
  }

  async createNewSignerRequest({
    token,
    walletAddress,
    signerAddress,
    deviceData,
    type,
    publicKeyX,
    publicKeyY,
    publicKeyId
  }: {
    token: string
    walletAddress: string
    signerAddress: string
    deviceData: DeviceData
    type: NewSignerRequestType
    publicKeyId?: string
    publicKeyX?: string
    publicKeyY?: string
  }): Promise<void> {
    const config = {
      headers: {
        token
      }
    }

    const body = {
      walletAddress,
      signerAddress,
      deviceData,
      type,
      publicKeyX,
      publicKeyY,
      publicKeyId
    }
    await this.api.post(`/user/new-signer-request`, body, config)
  }

  async deleteNewSignerRequest({
    token,
    signerAddress
  }: {
    token: string
    signerAddress: string
  }): Promise<void> {
    const config = {
      headers: {
        token
      }
    }

    await this.api.delete(`/user/new-signer-request/${signerAddress}`, config)
  }

  async deployWebAuthnSigner({
    token,
    walletAddress,
    publicKeyId,
    publicKeyX,
    publicKeyY,
    deviceData
  }: {
    token: string
    walletAddress: string
    publicKeyId: string
    publicKeyX: string
    publicKeyY: string
    deviceData: DeviceData
  }): Promise<string> {
    const config = {
      headers: {
        token
      }
    }

    const body = {
      walletAddress,
      publicKeyId,
      publicKeyX,
      publicKeyY,
      deviceData
    }

    const response = await this.api.post(
      `/user/deploy-webauthn-signer`,
      body,
      config
    )
    return response.data?.signerAddress
  }

  /**
   * WebAuthn Section
   */

  async predictWebAuthnSignerAddress({
    publicKeyX,
    publicKeyY
  }: {
    publicKeyX: string
    publicKeyY: string
  }): Promise<string> {
    const body = {
      publicKeyX,
      publicKeyY
    }

    const response = await this.api.post(
      `/webauthn-signer/predict-address`,
      body
    )
    return response.data?.signerAddress
  }

  async getWebAuthnSignerByPublicKeyId(
    publicKeyId: string
  ): Promise<WebAuthnSigner> {
    const response = await this.api.get(
      `/webauthn-signer/public-key-id/${publicKeyId}`
    )
    return response?.data?.webAuthnSigner
  }

  async getWebAuthnSignersByWalletAddress(
    walletAddress: string
  ): Promise<WebAuthnSigner[]> {
    const response = await this.api.get(`/webauthn-signer/${walletAddress}`)
    return response?.data?.webAuthnSigners
  }

  /**
   * New signer request
   */

  async getNewSignerRequests(
    walletAddress: string
  ): Promise<NewSignerRequest[] | null> {
    const response = await this.api.get(`/new-signer-request/${walletAddress}`)

    return response.data.signerRequests
  }

  /**
   * Gas Price Section
   */

  async getGasPriceForToken(tokenAddress: string): Promise<BigNumber> {
    const response = await this.api.get(`/gas-price/${tokenAddress}`)

    return BigNumber.from(response.data.gasPriceToken.hex)
  }
}
