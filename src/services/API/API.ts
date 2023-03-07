import axios from 'axios'
import { SiweMessage } from 'siwe'

import { API_URL } from '../../constants'
import { RelayTransactionType, UserNonceType } from '../../types'

export class API {
  static async getNonce(account: string): Promise<UserNonceType | null> {
    const url = `${API_URL}/wallets/connection-nonce/${account}`
    const response = await axios.get(url)
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
    const url = `${API_URL}/wallets/connect`
    const body = {
      message,
      signature,
      ownerAddress
    }

    const response = await axios.post(url, body)
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
    const url = `${API_URL}/wallets/${smartWalletAddress}/relay`
    const body = {
      ...safeTxData,
      baseGas: safeTxData?.baseGas?.toString(),
      gasPrice: safeTxData?.gasPrice?.toString(),
      safeTxGas: safeTxData?.safeTxGas?.toString(),
      signatures
    }
    const response = await axios.post(url, body)
    if (response?.data?.relayId) {
      return response?.data?.relayId
    }
    return null
  }
}
