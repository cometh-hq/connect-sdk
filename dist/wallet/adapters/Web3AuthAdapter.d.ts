import { UserInfo } from '@web3auth/base'
import { ethers } from 'ethers'

import { EOAAdapter } from './types'
export declare class Web3AuthAdapter implements EOAAdapter {
  private web3auth
  private ethProvider
  private web3authConfig
  constructor({ web3authConfig }: { web3authConfig: any })
  init(): Promise<void>
  connect(): Promise<void>
  logout(): Promise<void>
  getAccount(): Promise<string | null>
  getSigner(): ethers.Signer | null
  getEthProvider(): ethers.providers.Web3Provider | null
  getUserInfos(): Promise<Partial<UserInfo>>
}
