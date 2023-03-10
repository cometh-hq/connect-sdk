import { SiweMessage } from 'siwe'

import {
  RelayTransactionType,
  TransactionStatus,
  UserNonceType
} from '../../types'

export declare class API {
  static getNonce(account: string): Promise<UserNonceType | null>
  static connectToAlembicWallet({
    message,
    signature,
    ownerAddress
  }: {
    message: SiweMessage
    signature: string
    ownerAddress: string
  }): Promise<string | null>
  static relayTransaction({
    smartWalletAddress,
    safeTxData,
    signatures
  }: RelayTransactionType): Promise<string | null>
  static getRelayTxStatus(relayId: string): Promise<TransactionStatus | null>
}
