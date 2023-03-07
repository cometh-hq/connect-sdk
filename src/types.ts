import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import { ethers } from 'ethers'

export type UserNonceType = {
  userAddress: string
  connectionNonce: string
}
export type Constructor<T> = new (...args: any[]) => T
export type RelayTransactionType = {
  safeTxData: SafeTransactionDataPartial
  signatures: string
  smartWalletAddress: string
}
