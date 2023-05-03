import { UserInfo } from '@web3auth/base'
import { Web3AuthCoreOptions } from '@web3auth/core'
import { ethers } from 'ethers'

import { AUTHAdapter } from './types'
export declare class Web3AuthAdapter implements AUTHAdapter {
  private web3auth
  private ethProvider
  private web3authConfig
  readonly chaindId: string
  constructor(web3authConfig: Web3AuthCoreOptions)
  init(): Promise<void>
  connect(): Promise<void>
  logout(): Promise<void>
  getAccount(): Promise<string | null>
  getSigner(): ethers.Signer | null
  getEthProvider(): ethers.providers.Web3Provider | null
  getUserInfos(): Promise<Partial<UserInfo>>
}
