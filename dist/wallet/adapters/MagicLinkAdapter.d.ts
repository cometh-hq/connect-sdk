import { JsonRpcSigner } from '@ethersproject/providers'
import { MagicSDKAdditionalConfiguration } from 'magic-sdk'

import { UserInfos } from '../types'
import { AUTHAdapter } from './types'
export interface MagicLinkAdapterConfig {
  apiKey: string
  options: MagicSDKAdditionalConfiguration & {
    chainId: string
  }
}
export declare class MagicLinkAdapter implements AUTHAdapter {
  private magic
  private ethProvider
  private magicConfig
  readonly chainId: string
  constructor(magicConfig: MagicLinkAdapterConfig)
  connect(): Promise<void>
  logout(): Promise<void>
  getAccount(): Promise<string | null>
  getSigner(): JsonRpcSigner
  getUserInfos(): Promise<Partial<UserInfos>>
}
