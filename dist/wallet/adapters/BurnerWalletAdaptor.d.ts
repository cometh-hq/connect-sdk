import { ethers } from 'ethers'

import { AUTHAdapter } from './types'
export declare class BurnerWalletAdaptor implements AUTHAdapter {
  private ethProvider
  private wallet
  readonly chainId: string
  constructor(chainId: string, rpcUrl: string)
  init(): Promise<void>
  connect(): Promise<void>
  logout(): Promise<void>
  getAccount(): Promise<string | null>
  getSigner(): ethers.providers.JsonRpcSigner | null
  getEthProvider(): ethers.providers.Web3Provider | null
  getUserInfos(): Promise<Partial<any>>
}
