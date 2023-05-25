import { Wallet } from 'ethers'

import { UserInfos } from '../types'
import { AUTHAdapter } from './types'
export declare class BurnerWalletAdaptor implements AUTHAdapter {
  private wallet
  readonly chainId: string
  constructor(chainId: string)
  init(): Promise<void>
  logout(): Promise<void>
  getAccount(): Promise<string>
  getSigner(): Wallet
  getUserInfos(): Promise<Partial<UserInfos>>
}
