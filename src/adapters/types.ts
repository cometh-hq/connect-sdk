import { ethers } from 'ethers'

import { Constructor } from '../types'

export interface EOAAdapter {
  init(chainId: number, rpcTarget: string): Promise<void>
  logout(): Promise<void>
  connect(): Promise<void>
  getAccount(): Promise<string | null>
  getSigner(): ethers.Signer | null
  getEthProvider(): ethers.providers.Web3Provider | null
}

export type EOAConstructor = Constructor<EOAAdapter>
