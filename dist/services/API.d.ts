import { SiweMessage } from 'siwe'

import {
  RelayTransactionType,
  SponsoredTransaction,
  UserNonceType,
  WebAuthnOwner
} from '../wallet/types'
export declare const api: import('axios').AxiosInstance
export declare class API {
  constructor(apiKey: string, chainId: number)
  getNonce(account: string): Promise<UserNonceType>
  getSponsoredAddresses(): Promise<SponsoredTransaction[]>
  connectToAlembicWallet({
    message,
    signature,
    ownerAddress
  }: {
    message: SiweMessage
    signature: string
    ownerAddress: string
  }): Promise<string>
  relayTransaction({
    walletAddress,
    safeTxData,
    signatures
  }: RelayTransactionType): Promise<string>
  addWebAuthnOwner(
    walletAddress: any,
    signerName: any,
    publicKeyId: any,
    publicKeyX: any,
    publicKeyY: any,
    signature: any,
    message: any,
    addOwnerTxData: any,
    addOwnerTxSignature: any
  ): Promise<WebAuthnOwner>
  getWebAuthnOwnerByPublicKeyId(publicKeyId: string): Promise<WebAuthnOwner>
  getWebAuthnOwners(walletAddress: string): Promise<WebAuthnOwner[]>
}
