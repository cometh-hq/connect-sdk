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
  readonly operation?: OperationType | string
  readonly safeTxGas?: number | string
  readonly baseGas?: number | string
  readonly gasPrice?: number | string
  readonly gasToken?: number | string
  readonly refundReceiver?: string
  readonly nonce?: number | string
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
}
export type UserInfos = {
  ownerAddress: string | undefined
  walletAddress: string
  email: string | null
}

export type TransactionStatus = {
  hash: string
  status: string
}

export type SendTransactionResponse = {
  safeTxHash: string
}

export interface WalletUiConfig {
  displayValidationModal: boolean
}

export type WebAuthnOwner = {
  customerId: string
  walletAddress: string
  publicKeyId: string
  publicKeyX: string
  publicKeyY: string
  signature: string
  signerAddress: string
  userId?: string
}

export type UIConfig = {
  displayValidationModal: boolean
}

export type SocialRecoveryConfigType = {
  customerId: string
  defaultGuardians: string[]
  defaultGuardiansThreshold: number
}

export type WalletInfos = {
  address: string
  connectionDate: Date
  creationDate: Date
  userId: string
}

export type DeviceData = {
  browser: string
  os: string
  platform: string
}
