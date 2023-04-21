import { SiweMessage } from 'siwe'

import {
  RelayTransactionType,
  SponsoredTransaction,
  TransactionStatus,
  UserNonceType
} from '../wallet/types'
export declare const api: import('axios').AxiosInstance
export declare class API {
  constructor(apiKey: string)
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
    signatures,
    transactionHash
  }: RelayTransactionType): Promise<string>
  getRelayTxStatus(
    walletAddress: string,
    transactionHash: string
  ): Promise<TransactionStatus>
}
