import { ethers } from 'ethers'

import { AUTHAdapter } from './types'
export declare class BurnerWalletAdaptor implements AUTHAdapter {
  private ethProvider
  private signer
  private wallet
  readonly chainId: string
  constructor(chainId: string)
  init(): Promise<void>
  connect(): Promise<void>
  logout(): Promise<void>
  getAccount(): Promise<string | null>
  getSigner(): ethers.providers.JsonRpcSigner | null
  getUserInfos(): Promise<Partial<any>>
}
