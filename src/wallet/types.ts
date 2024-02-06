export type UIConfig = {
  displayValidationModal: boolean
}

export type UserNonceType = {
  walletAddress: string
  connectionNonce: string
}

export type SponsoredTransaction = {
  projectId: string
  targetAddress: string
}

export type WalletInfos = {
  chainId: string
  address: string
  creationDate: Date
  initiatorAddress: string
  recoveryContext?: {
    moduleFactoryAddress: string
    delayModuleAddress: string
    recoveryCooldown: number
    recoveryExpiration: number
  }
  proxyDelayAddress: string
}

export type ProjectParams = {
  chainId: string
  P256FactoryContractAddress: string
  multisendContractAddress: string
  singletonAddress: string
  simulateTxAcessorAddress: string
}

export enum SupportedNetworks {
  POLYGON = '0x89',
  MUMBAI = '0x13881',
  AVALANCHE = '0xa86a',
  FUJI = '0xa869',
  GNOSIS = '0x64',
  CHIADO = '0x27d8',
  MUSTER_TESTNET = '0x205e79',
  MUSTER = '0xfee',
  REDSTONE_HOLESKY = '0x4269'
}

export enum DefaultSponsoredFunctions {
  ADD_OWNER_FUNCTION_SELECTOR = '0x0d582f13',
  SET_DELAY_TX_NONCE_SELECTOR = '0x46ba2307'
}

export declare enum OperationType {
  Call = 0,
  DelegateCall = 1
}

export interface MetaTransactionData {
  readonly to: string
  readonly value: string
  readonly data: string
  readonly operation?: OperationType | string
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

export type RelayTransactionType = {
  safeTxData: SafeTransactionDataPartial
  signatures: string
  walletAddress: string
}

export type SendTransactionResponse = {
  safeTxHash: string
}

export type TransactionStatus = {
  hash: string
  status: string
}

export type WebAuthnDeploymentParams = {
  P256FactoryContract: string
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
  deploymentParams: WebAuthnDeploymentParams
}

export interface webAuthnOptions {
  authenticatorSelection?: {
    authenticatorAttachment?: AuthenticatorAttachment
    userVerification?: UserVerificationRequirement
    requireResidentKey?: boolean
    residentKey?: ResidentKeyRequirement
  }
  extensions?: any
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

export type Signer = {
  walletAddress: string
  signerAddress: string
  deviceData: DeviceData
  publicKeyId?: string
  publicKeyX?: string
  publicKeyY?: string
}

export type NewSignerRequestBody = Signer & {
  type: NewSignerRequestType
}

export type NewSignerRequest = NewSignerRequestBody & {
  projectId: string
  userId: string
  chainId: string
}

export type fallbackStorageValues = {
  encryptedPrivateKey: string
  iv: string
}

export type RecoveryRequest = {
  txCreatedAt: string
  txHash: string
}

export type EnshrinedOwner = {
  address: string
  deviceData?: DeviceData
}
