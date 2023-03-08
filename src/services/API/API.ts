import axios from 'axios'
import { SiweMessage } from 'siwe'

import { api } from '../../config'
import { RelayTransactionType, UserNonceType } from '../../types'

export class API {
  static async getNonce(account: string): Promise<UserNonceType | null> {
    const response = await api.get(`/wallets/connection-nonce/${account}`)
    const userNonce = response?.data?.userNonce
    if (userNonce) {
      return userNonce
    }
    return null
  }

  static async connectToAlembicWallet({
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
    if (data) {
      return data
    }
    return null
  }

  static async relayTransaction({
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
}
