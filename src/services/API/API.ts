import axios from 'axios'
import { SiweMessage } from 'siwe'

import { API_URL } from '../../constants'
import {
  RelayTransactionType,
  TransactionStatus,
  UserNonceType
} from '../../types'

export const api = axios.create({
  baseURL: API_URL
})

export class API {
  constructor(apiKey: string) {
    api.defaults.headers.common['apikey'] = apiKey
  }

  async getNonce(account: string): Promise<UserNonceType | null> {
    const response = await api.get(`/wallets/connection-nonce/${account}`)
    const userNonce = response?.data?.userNonce
    if (userNonce) {
      return userNonce
    }
    return null
  }

  async connectToAlembicWallet({
    message,
    signature,
    ownerAddress
  }: {
    message: SiweMessage
    signature: string
    ownerAddress: string
  }): Promise<string | null> {
    const body = {
      message,
      signature,
      ownerAddress
    }

    const response = await api.post(`/wallets/connect`, body)
    const data = response?.data
    if (data?.walletAddress) {
      return data.walletAddress
    }
    return null
  }

  async relayTransaction({
    smartWalletAddress,
    safeTxData,
    signatures
  }: RelayTransactionType): Promise<string | null> {
    const body = {
      ...safeTxData,
      baseGas: safeTxData?.baseGas?.toString(),
      gasPrice: safeTxData?.gasPrice?.toString(),
      safeTxGas: safeTxData?.safeTxGas?.toString(),
      signatures
    }
    const response = await api.post(
      `/wallets/${smartWalletAddress}/relay`,
      body
    )
    if (response?.data?.relayId) {
      return response?.data?.relayId
    }
    return null
  }

  async getRelayTxStatus(relayId: string): Promise<TransactionStatus | null> {
    const response = await api.get(`/wallets/relay/${relayId}`)
    if (response?.data) {
      return response?.data
    }
    return null
  }
}
