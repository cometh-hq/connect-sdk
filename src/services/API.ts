import axios, { AxiosInstance } from 'axios'
import { TypedDataDomain, TypedDataField } from 'ethers'
import { SiweMessage } from 'siwe'

import { API_URL } from '../constants'
import {
  DeviceData,
  EncryptedEncryptionKeyParams,
  EncryptedWalletParams,
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
    await this.api.post(`/new-signer-request/create`, body, config)
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

  /**
   * Alembic Auth Section
   */

  async connectToAlembicAuth(token: string): Promise<string> {
    const config = {
      headers: {
        token
      }
    }

    const response = await this.api.post(`/key-store/connect`, {}, config)
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
    const response = await this.api.post(
      `/key-store/signTypedData`,
      body,
      config
    )
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

    const response = await this.api.get(
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

    const response = await this.api.get(
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

    const response = await this.api.get(
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

    await this.api.post('/encrypted-account/encryption-key', body, config)
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

    await this.api.post('/encrypted-account/encryption-wallet', body, config)
  }
}
