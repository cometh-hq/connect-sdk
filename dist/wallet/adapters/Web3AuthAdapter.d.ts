import { JsonRpcSigner } from '@ethersproject/providers'
import { UserInfo } from '@web3auth/base'
import { Web3AuthCoreOptions } from '@web3auth/core'

import { AUTHAdapter } from './types'
export declare class Web3AuthAdapter implements AUTHAdapter {
  private web3auth
  private ethProvider
  private web3authConfig
  readonly chainId: string
  constructor(web3authConfig: Web3AuthCoreOptions)
  init(): Promise<void>
  connect(): Promise<void>
  logout(): Promise<void>
  getAccount(): Promise<string | null>
  getSigner(): JsonRpcSigner
  getUserInfos(): Promise<Partial<UserInfo>>
}
