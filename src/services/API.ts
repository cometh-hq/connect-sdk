import axios from 'axios'
import { TypedDataDomain, TypedDataField } from 'ethers'
import { SiweMessage } from 'siwe'

import { API_URL } from '../constants'
import {
  DeviceData,
  EncryptedEncryptionKeyParams,
  EncryptedWalletParams,
  RelayTransactionType,
  SponsoredTransaction,
  UserNonceType,
  WalletInfos,
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

  async getWalletAddress(ownerAddress: string): Promise<string> {
    const response = await api.get(`/wallets/${ownerAddress}/getWalletAddress`)
    return response?.data?.walletAddress
  }

  async getWalletInfos(walletAddress: string): Promise<WalletInfos> {
    const response = await api.get(`/wallets/${walletAddress}/getWalletInfos`)
    return response?.data?.walletInfos
  }

  async getSponsoredAddresses(): Promise<SponsoredTransaction[]> {
    const response = await api.get(`/sponsored-address`)
    return response?.data?.sponsoredAddresses
  }

  async connectToAlembicWallet({
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

    const response = await api.post(`/wallets/connect`, body)

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
    const response = await api.post(`/wallets/${walletAddress}/relay`, body)
    return response.data?.safeTxHash
  }

  /**
   * WebAuthn Section
   */

  async createWalletWithWebAuthn({
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

    await api.post(`/wallets/createWalletWithWebAuthn`, body, config)
  }

  async addWebAuthnOwner({
    token,
    walletAddress,
    publicKeyId,
    publicKeyX,
    publicKeyY,
    addOwnerTxData,
    addOwnerTxSignature,
    deviceData
  }: {
    token: string
    walletAddress: string
    publicKeyId: string
    publicKeyX: string
    publicKeyY: string
    addOwnerTxData: any
    addOwnerTxSignature: string
    deviceData: DeviceData
  }): Promise<WebAuthnOwner> {
    const config = {
      headers: {
        token
      }
    }

    const body = {
      publicKeyId,
      publicKeyX,
      publicKeyY,
      addOwnerTxData,
      addOwnerTxSignature,
      deviceData
    }

    const response = await api.post(
      `/wallets/${walletAddress}/webAuthnOwner`,
      body,
      config
    )
    return response.data?.webAuthnOwner
  }

  async getWebAuthnOwnerByPublicKeyId(
    token: string,
    publicKeyId: string
  ): Promise<WebAuthnOwner> {
    const config = {
      headers: {
        token
      }
    }
    const response = await api.get(
      `/webAuthnOwners/${publicKeyId}/byCredential`,
      config
    )
    return response?.data?.webAuthnOwner
  }

  async getWebAuthnOwners(
    token: string,
    walletAddress: string
  ): Promise<WebAuthnOwner[]> {
    const config = {
      headers: {
        token
      }
    }
    const response = await api.get(
      `/webAuthnOwners/${walletAddress}/all`,
      config
    )
    return response?.data?.webAuthnOwners
  }

  async getWebAuthnOwnersByUser(token: string): Promise<WebAuthnOwner[]> {
    const config = {
      headers: {
        token
      }
    }
    const response = await api.get(`/webAuthnOwners/byUser`, config)
    return response?.data?.webAuthnOwners
  }

  async createAddDeviceRequest({
    token,
    walletAddress,
    publicKeyX,
    publicKeyY,
    publicKeyId,
    signerAddress,
    deviceData
  }: {
    token: string
    walletAddress: string
    publicKeyX: string
    publicKeyY: string
    publicKeyId: string
    signerAddress: string
    deviceData: DeviceData
  }): Promise<void> {
    const config = {
      headers: {
        token
      }
    }
    const body = {
      walletAddress,
      publicKeyX,
      publicKeyY,
      publicKeyId,
      signerAddress,
      deviceData
    }
    await api.post(`/webAuthnOwners/add-device`, body, config)
  }

  /**
   * Alembic Auth Section
   */

  async connectToAlembicAuth(token: string): Promise<string> {
    const config = {
      headers: {
        token
      }
    }

    const response = await api.post(`/key-store/connect`, {}, config)
    return response?.data?.address
  }

  async signTypedDataWithAlembicAuth(
    token: string,
    domain: TypedDataDomain,
    types: Record<string, TypedDataField[]>,
    value: Record<string, any>
  ): Promise<string> {
    const config = {
      headers: {
        token
      }
    }
    const body = {
      domain,
      types,
      value
    }
    const response = await api.post(`/key-store/signTypedData`, body, config)
    return response?.data?.signature
  }

  async verifyEncryptionKey(
    token: string
  ): Promise<{ exists: boolean; userId: string }> {
    const config = {
      headers: {
        token
      }
    }

    const response = await api.get(
      `/encrypted-account/encryption-key/verify`,
      config
    )
    const exists = response?.data.exists
    const userId = response?.data.userId

    return { exists, userId }
  }

  async getEncryptionKey(
    token: string,
    passwordHash: string
  ): Promise<EncryptedEncryptionKeyParams> {
    const config = {
      headers: {
        token
      }
    }

    const response = await api.get(
      `/encrypted-account/${passwordHash}/encryption-key`,
      config
    )
    const encryptedEncryptionKey = response?.data.encryptedEncryptionKey
    const encryptedEncryptionKeyIV = response?.data.encryptedEncryptionKeyIV
    return { encryptedEncryptionKey, encryptedEncryptionKeyIV }
  }

  async getEncryptedWallet(
    token: string,
    passwordHash: string
  ): Promise<EncryptedWalletParams> {
    const config = {
      headers: {
        token
      }
    }

    const response = await api.get(
      `/encrypted-account/${passwordHash}/encryption-wallet`,
      config
    )

    const encryptedMnemonic = response?.data.encryptedMnemonic
    const encryptedMnemonicIV = response?.data.encryptedMnemonicIV
    return { encryptedMnemonic, encryptedMnemonicIV }
  }

  async createEncryptedAccount({
    token,
    iterations,
    passwordHash,
    passwordDerivedKeyHash,
    encryptedEncryptionKey,
    encryptedEncryptionKeyIV
  }: {
    token: string
    iterations: number
    passwordHash: string
    passwordDerivedKeyHash: ArrayBuffer
    encryptedEncryptionKey: ArrayBuffer
    encryptedEncryptionKeyIV: ArrayBuffer
  }): Promise<void> {
    const config = {
      headers: {
        token
      }
    }

    const body = {
      iterations,
      passwordHash,
      passwordDerivedKeyHash: Buffer.from(passwordDerivedKeyHash),
      encryptedEncryptionKey: Buffer.from(encryptedEncryptionKey),
      encryptedEncryptionKeyIV: Buffer.from(encryptedEncryptionKeyIV)
    }

    await api.post('/encrypted-account/encryption-key', body, config)
  }

  async createEncryptedWallet({
    token,
    passwordHash,
    encryptedMnemonic,
    encryptedMnemonicIV
  }: {
    token: string
    passwordHash: string
    encryptedMnemonic: ArrayBuffer
    encryptedMnemonicIV: ArrayBuffer
  }): Promise<void> {
    const config = {
      headers: {
        token
      }
    }
    const body = {
      passwordHash,
      encryptedMnemonic: Buffer.from(encryptedMnemonic),
      encryptedMnemonicIV: Buffer.from(encryptedMnemonicIV)
    }

    await api.post('/encrypted-account/encryption-wallet', body, config)
  }
}
