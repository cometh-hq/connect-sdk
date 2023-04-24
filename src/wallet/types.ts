import { UserInfo } from '@web3auth/base'

export enum RelayStatus {
  MINED = 'mined'
}

export declare enum OperationType {
  Call = 0,
  DelegateCall = 1
}

export interface MetaTransactionData {
  readonly to: string
  readonly value: string
  readonly data: string
}

export interface SafeTransactionDataPartial extends MetaTransactionData {
  readonly operation?: OperationType
  readonly safeTxGas?: number
  readonly baseGas?: number
  readonly gasPrice?: number
  readonly gasToken?: string
  readonly refundReceiver?: string
  readonly nonce?: number
}

export type UserNonceType = {
  walletAddress: string
  connectionNonce: string
}
export type SponsoredTransaction = {
  customerId: string
  targetAddress: string
}
export type RelayTransactionType = {
  safeTxData: SafeTransactionDataPartial
  signatures: string
  walletAddress: string
  safeTxHash: string
}
export type UserInfos = Partial<UserInfo> & {
  ownerAddress: string | undefined
  walletAddress: string
}

export type TransactionStatus = {
  hash: string
  status: string
}

export type SendTransactionResponse = {
  safeTxHash: string
}
