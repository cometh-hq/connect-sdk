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

export type RelayedTransaction = {
  safeTxHash: string
  relayId: string
}

export type RelayedTransactionStatus = {
  received: {
    date: Date
  }
  attributed?: {
    date: Date
    relayerAddress: string
  }
  sent?: {
    date: Date
    hash: string
    gasLimit: string
    maxPriorityFeePerGas: string
    maxFeePerGas: string
    nonce: number
  }
  rebroadcasted?: {
    date: Date
    hash: string
    gasLimit: string
    maxPriorityFeePerGas: string
    maxFeePerGas: string
    nonce: number
  }[]
  confirmed?: {
    date: Date
    hash: string
    gasUsed: string
    effectiveGasPrice: string
    status: number
  }
}

export type RelayedTransactionDetails = {
  id: string
  to: string
  data: string
  projectId?: string
  isSponsored?: boolean
  status: RelayedTransactionStatus
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
  deploymentParams?: { deploymentManagerAddress: string }
  proxyDelayAddress?: string
}

export type ProjectParams = {
  chainId: string
  P256FactoryContractAddress: string
  multisendContractAddress: string
  singletonAddress: string
  simulateTxAcessorAddress: string
  deploymentManagerAddress: string
  guardianId: string
}

export enum SupportedNetworks {
  POLYGON = '0x89',
  MUMBAI = '0x13881',
  AMOY = '0x13882',
  AVALANCHE = '0xa86a',
  FUJI = '0xa869',
  XL_NETWORK = '0xc0c',
  GNOSIS = '0x64',
  CHIADO = '0x27d8',
  MUSTER = '0xfee',
  MUSTER_TESTNET = '0x205e79',
  REDSTONE_HOLESKY = '0x4269',
  OPTIMISM = '0xa',
  OPTIMISM_SEPOLIA = '0xaa37dc',
  ARBITRUM_ONE = '0xa4b1',
  ARBITRUM_SEPOLIA = '0x66eee',
  BASE = '0x2105',
  BASE_SEPOLIA = '0x14a34'
}

export enum DefaultSponsoredFunctions {
  ADD_OWNER_FUNCTION_SELECTOR = '0x0d582f13',
  REMOVE_OWNER_FUNCTION_SELECTOR = '0xf8dc5dd9',
  SET_DELAY_TX_NONCE_SELECTOR = '0x46ba2307',
  DEPLOY_DELAY_MODULE_FUNCTION_SELECTOR = '0xf1ab873c',
  ENABLE_GUARDIAN_FUNCTION_SELECTOR = '0x610b5925'
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
  relayId: string
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
  creationDate?: Date
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

export type WebAuthnCredential = {
  deviceData: DeviceData
  signerAddress: string
  publicKeyId: string
  publicKeyX: string
  publicKeyY: string
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
  creationDate?: Date
}

export type fallbackStorageValues = {
  encryptedPrivateKey: string
  iv: string
}

export type webauthnStorageValues = {
  publicKeyId: string
  signerAddress: string
}

export type RecoveryRequest = {
  txCreatedAt: string
  txHash: string
}

export type EnrichedOwner = {
  address: string
  deviceData?: DeviceData
  creationDate?: Date
}
