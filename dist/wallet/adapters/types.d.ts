import { UserInfo } from '@web3auth/base'
import { ethers } from 'ethers'
export interface AUTHAdapter {
  init(): Promise<void>
  logout(): Promise<void>
  connect(): Promise<void>
  getAccount(): Promise<string | null>
  getSigner(): ethers.providers.JsonRpcSigner | null
  getUserInfos(): Promise<Partial<UserInfo>>
  readonly chaindId: string
}
export type Constructor<T> = new (...args: any[]) => T