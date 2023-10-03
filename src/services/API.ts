import axios, { AxiosInstance } from 'axios'
import { SiweMessage } from 'siwe'

import { API_URL } from '../constants'
import {
  DeviceData,
  RelayTransactionType,
  SponsoredTransaction,
  UserNonceType,
  WalletInfos,
  WebAuthnSigner
} from '../wallet/types'

export class API {
  private readonly api: AxiosInstance

  constructor(apiKey: string, chainId: number, baseUrl?: string) {
    this.api = axios.create({ baseURL: baseUrl || API_URL })
    this.api.defaults.headers.common['apikey'] = apiKey
    this.api.defaults.headers.common['chainId'] = chainId
  }

  async getProjectParams(): Promise<{
    chainId: string
    P256FactoryContractAddress: string
    multisendContractAddress: string
  }> {
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

  async getWalletInfos(walletAddress: string): Promise<WalletInfos | null> {
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
  }: RelayTransactionType): Promise<string> {
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
    return response.data?.safeTxHash
  }

  /**
   * User Section
   */

  async initWallet({
    ownerAddress
  }: {
    ownerAddress: string
  }): Promise<string> {
    const body = {
      ownerAddress
    }

    const response = await this.api.post(`/user/init`, body)

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

    await this.api.post(`/user/init-with-webauthn`, body)
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

  async deployWebAuthnSigner({
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
  }): Promise<string> {
    const body = {
      publicKeyId,
      publicKeyX,
      publicKeyY,
      deviceData
    }

    const response = await this.api.post(
      `/webauthn-signer/${walletAddress}/deploy-webauthn-signer`,
      body
    )
    return response.data?.signerAddress
  }

  async getWebAuthnSignerByPublicKeyId(
    walletAddress: string,
    publicKeyId: string
  ): Promise<WebAuthnSigner> {
    const body = {
      walletAddress,
      publicKeyId
    }
    const response = await this.api.post(
      `/webauthn-signer/by-public-key-id`,
      body
    )
    return response?.data?.webAuthnSigner
  }

  async getWebAuthnSignersByWalletAddress(
    walletAddress: string
  ): Promise<WebAuthnSigner[]> {
    const response = await this.api.get(`/webauthn-signer/${walletAddress}`)
    return response?.data?.webAuthnSigners
  }
}
