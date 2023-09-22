import axios, { AxiosInstance } from 'axios'
import { SiweMessage } from 'siwe'

import { API_URL } from '../constants'
import {
  DeviceData,
  NewSignerRequest,
  NewSignerRequestType,
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

  async deployWalletWithWebAuthnSigner({
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
  }): Promise<void> {
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

    await this.api.post(`/wallets/deploy-with-webauthn-signer`, body, config)
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

  async getWalletAddressFromUserID(token: string): Promise<string> {
    const config = {
      headers: {
        token
      }
    }
    const response = await this.api.get(`/user/address`, config)
    return response?.data?.walletAddress
  }

  /**
   * WebAuthn Section
   */

  async predictWebAuthnSignerAddress({
    token,
    publicKeyX,
    publicKeyY
  }: {
    token: string
    publicKeyX: string
    publicKeyY: string
  }): Promise<string> {
    const config = {
      headers: {
        token
      }
    }

    const body = {
      publicKeyX,
      publicKeyY
    }

    const response = await this.api.post(
      `/webauthn-signer/predict-address`,
      body,
      config
    )
    return response.data?.signerAddress
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
      publicKeyId,
      publicKeyX,
      publicKeyY,
      deviceData
    }

    const response = await this.api.post(
      `/webauthn-signer/${walletAddress}/deploy-webauthn-signer`,
      body,
      config
    )
    return response.data?.signerAddress
  }

  async getWebAuthnSignerByPublicKeyId(
    token: string,
    publicKeyId: string
  ): Promise<WebAuthnSigner> {
    const config = {
      headers: {
        token
      }
    }
    const response = await this.api.get(
      `/webauthn-signer/public-key-id/${publicKeyId}`,
      config
    )
    return response?.data?.webAuthnSigner
  }

  async getWebAuthnSignersByUser(token: string): Promise<WebAuthnSigner[]> {
    const config = {
      headers: {
        token
      }
    }

    const response = await this.api.get(`/webauthn-signer`, config)
    return response?.data?.webAuthnSigners
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
    publicKeyId: string
    publicKeyX: string
    publicKeyY: string
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
    await this.api.post(`/new-signer-request`, body, config)
  }

  async getNewSignerRequestByUser(
    token: string
  ): Promise<NewSignerRequest[] | null> {
    const config = {
      headers: {
        token
      }
    }

    const response = await this.api.get(`/new-signer-request`, config)

    return response.data.signerRequests
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

    await this.api.delete(`/new-signer-request/${signerAddress}`, config)
  }
}
