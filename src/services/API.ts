import axios from 'axios'
import { SiweMessage } from 'siwe'

import { API_URL } from '../constants'
import {
  RelayTransactionType,
  SponsoredTransaction,
  UserNonceType,
  WebAuthnOwner
} from '../wallet/types'

export const api = axios.create({
  baseURL: API_URL
})

export class API {
  constructor(apiKey: string, chainId: number) {
    api.defaults.headers.common['apikey'] = apiKey
    api.defaults.headers.common['chainId'] = chainId
  }

  async getNonce(account: string): Promise<UserNonceType> {
    const response = await api.get(`/wallets/connection-nonce/${account}`)
    return response?.data?.userNonce
  }

  async getSponsoredAddresses(): Promise<SponsoredTransaction[]> {
    const response = await api.get(`/sponsored-address`)
    return response?.data?.sponsoredAddresses
  }

  async connectToAlembicWallet({
    message,
    signature,
    ownerAddress
  }: {
    message: SiweMessage
    signature: string
    ownerAddress: string
  }): Promise<string> {
    const body = {
      message,
      signature,
      ownerAddress
    }

    const response = await api.post(`/wallets/connect`, body)
    const data = response?.data

    return data.walletAddress
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
    const response = await api.post(`/wallets/${walletAddress}/relay`, body)
    return response.data?.safeTxHash
  }

  async addWebAuthnOwner(
    walletAddress,
    publicKeyId,
    publicKeyX,
    publicKeyY,
    signature,
    message,
    addOwnerTxData,
    addOwnerTxSignature
  ): Promise<WebAuthnOwner> {
    const body = {
      publicKeyId,
      publicKeyX,
      publicKeyY,
      signature,
      message,
      addOwnerTxData,
      addOwnerTxSignature
    }

    const response = await api.post(
      `/wallets/${walletAddress}/webAuthnOwner`,
      body
    )
    return response.data?.webAuthnOwner
  }

  async getWebAuthnOwnerByPublicKeyId(
    publicKeyId: string
  ): Promise<WebAuthnOwner> {
    const response = await api.get(`/wallets/${publicKeyId}/webAuthnOwner`)
    return response?.data?.webAuthnOwner
  }

  async getWebAuthnOwners(walletAddress: string): Promise<WebAuthnOwner[]> {
    const response = await api.get(`/wallets/${walletAddress}/webAuthnOwners`)
    return response?.data?.webAuthnOwners
  }
}
