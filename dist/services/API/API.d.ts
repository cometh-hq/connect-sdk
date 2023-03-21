import { SiweMessage } from 'siwe'

import {
  RelayTransactionType,
  TransactionStatus,
  UserNonceType
} from '../../types'

export declare const api: import('axios').AxiosInstance
export declare class API {
  constructor(apiKey: string)
  getNonce(account: string): Promise<UserNonceType | null>
  connectToAlembicWallet({
    message,
    signature,
    ownerAddress
  }: {
    message: SiweMessage
    signature: string
    ownerAddress: string
  }): Promise<string | null>
  relayTransaction({
    smartWalletAddress,
    safeTxData,
    signatures
  }: RelayTransactionType): Promise<string | null>
  getRelayTxStatus(relayId: string): Promise<TransactionStatus | null>
}
