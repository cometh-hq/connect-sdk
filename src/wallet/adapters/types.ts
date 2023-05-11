import { ethers } from 'ethers'

import { UserInfos } from '../types'
export interface AUTHAdapter {
  init(): Promise<void>
  logout(): Promise<void>
  connect(): Promise<void>
  getAccount(): Promise<string | null>
  getSigner(): ethers.Signer | null
  getEthProvider(): ethers.providers.Web3Provider | null
  getUserInfos(): Promise<Partial<UserInfos>>
  readonly chaindId: string
}

export type Constructor<T> = new (...args: any[]) => T
