import { JsonRpcSigner } from '@ethersproject/providers'
import { Web3AuthCoreOptions } from '@web3auth/core'

import { UserInfos } from '../types'
import { AUTHAdapter } from './types'
export declare class Web3AuthAdapter implements AUTHAdapter {
  private web3auth
  private ethProvider
  private web3authConfig
  readonly chainId: string
  constructor(web3authConfig: Web3AuthCoreOptions)
  connect(): Promise<void>
  logout(): Promise<void>
  getAccount(): Promise<string | null>
  getSigner(): JsonRpcSigner
  getUserInfos(): Promise<Partial<UserInfos>>
}
