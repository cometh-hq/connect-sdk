import { UserInfo } from '@web3auth/base'
import { ethers } from 'ethers'
export interface EOAAdapter {
  init(chainId: number, rpcTarget: string): Promise<void>
  logout(): Promise<void>
  connect(): Promise<void>
  getAccount(): Promise<string | null>
  getBalance(): Promise<ethers.BigNumber | null>
  getSigner(): ethers.Signer | null
  getEthProvider(): ethers.providers.Web3Provider | null
  getUserInfos(): Promise<Partial<UserInfo>>
}
export type Constructor<T> = new (...args: any[]) => T
export type EOAConstructor = Constructor<EOAAdapter>
