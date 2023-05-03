import { UserInfo } from '@web3auth/base'
import { ethers } from 'ethers'

export interface EOAAdapter {
  init(): Promise<void>
  logout(): Promise<void>
  connect(): Promise<void>
  getAccount(): Promise<string | null>
  getSigner(): ethers.Signer | null
  getEthProvider(): ethers.providers.Web3Provider | null
  getUserInfos(): Promise<Partial<UserInfo>>
}

export type Constructor<T> = new (...args: any[]) => T
export type EOAConstructor = Constructor<EOAAdapter>
