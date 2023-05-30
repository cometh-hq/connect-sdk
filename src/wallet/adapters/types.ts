import { JsonRpcSigner } from '@ethersproject/providers'
import { Wallet } from 'ethers'

import { UserInfos } from '../types'
export interface AUTHAdapter {
  logout(): Promise<void>
  connect(): Promise<void>
  getAccount(): Promise<string | null>
  getSigner(): JsonRpcSigner | Wallet
  getUserInfos(): Promise<Partial<UserInfos>>
  readonly chainId: string
}

export type Constructor<T> = new (...args: any[]) => T
