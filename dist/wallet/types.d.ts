import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import { UserInfo } from '@web3auth/base'
export declare enum RelayStatus {
  MINED = 'mined'
}
export type UserNonceType = {
  userAddress: string
  connectionNonce: string
}
export type SponsoredTransaction = {
  customerId: string
  userAddress: string
}
export type RelayTransactionType = {
  safeTxData: SafeTransactionDataPartial
  signatures: string
  smartWalletAddress: string
}
export type UserInfos = Partial<UserInfo> & {
  ownerAddress: string | undefined
  smartWalletAddress: string
}
export type TransactionStatus = {
  hash: string
  status: string
}
export type SendTransactionResponse = {
  relayId: string
  safeTransactionHash: string
}
