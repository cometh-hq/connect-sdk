import { JsonRpcSigner } from '@ethersproject/providers'
import { UserInfo } from '@web3auth/base'
import { Wallet } from 'ethers'
export interface AUTHAdapter {
  logout(): Promise<void>
  connect(): Promise<void>
  getAccount(): Promise<string | null>
  getSigner(): JsonRpcSigner | Wallet
  getUserInfos(): Promise<Partial<UserInfo>>
  readonly chainId: string
}
export type Constructor<T> = new (...args: any[]) => T
