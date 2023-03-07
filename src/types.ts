import { ethers } from 'ethers'

export type UserNonceType = {
  userAddress: OwnerAddress
  connectionNonce: string
}
export type OwnerAddress = `0x${string}`
export type SmartWalletAddress = `0x${string}`
export type Constructor<T> = new (...args: any[]) => T
export type EthProvider = ethers.providers.Web3Provider
