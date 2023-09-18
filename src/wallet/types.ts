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
  projectId: string
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

export type WebAuthnSigner = {
  projectId: string
  userId: string
  chainId: string
  walletAddress: string
  publicKeyId: string
  publicKeyX: string
  publicKeyY: string
  signerAddress: string
  deviceData: DeviceData
  isActive: boolean
}

export type UIConfig = {
  displayValidationModal: boolean
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

export enum NewSignerRequestType {
  WEBAUTHN = 'WEBAUTHN',
  BURNER_WALLET = 'BURNER_WALLET'
}

export type NewSignerRequest = {
  projectId: string
  userId: string
  chainId: string
  walletAddress: string
  signerAddress: string
  deviceData: DeviceData
  type: NewSignerRequestType
  publicKeyId?: string
  publicKeyX?: string
  publicKeyY?: string
}
