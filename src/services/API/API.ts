import axios from 'axios'
import { SiweMessage } from 'siwe'

import { API_URL } from '../../constants'
import { OwnerAddress, UserNonceType, WalletAddress } from '../../types'

export class API {
  static async getNonce(account: string): Promise<UserNonceType | null> {
    const url = `${API_URL}/wallets/connection-nonce/${account}`

    try {
      const response = await axios.get(url)
      const userNonce = response?.data?.userNonce
      if (userNonce) {
        return userNonce
      }
    } catch (e) {
      throw new Error('Error getting nonce')
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
    ownerAddress: OwnerAddress
  }): Promise<WalletAddress | null> {
    const url = `${API_URL}/wallets/connect`
    const body = {
      message,
      signature,
      ownerAddress
    }
    try {
      const response = await axios.post(url, body)
      const data = response?.data
      if (data) {
        return data
      }
    } catch (e) {
      throw new Error('Error connecting to Alembic Wallet')
    }

    return null
  }
}
