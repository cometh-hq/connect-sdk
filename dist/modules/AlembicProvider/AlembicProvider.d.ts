import { RequestArguments } from 'eip1193-provider'
import { ethers } from 'ethers'

import { SmartWallet } from '../SmartWallet'

export interface AlembicProviderConfig {
  ethProvider: ethers.providers.Web3Provider
  smartWallet: SmartWallet
  apiKey: string
}
export declare class AlembicProvider {
  private ethProvider
  private smartWallet
  private API
  constructor({ ethProvider, smartWallet, apiKey }: AlembicProviderConfig)
  request(request: RequestArguments): Promise<any>
}
