import { ethers } from 'ethers'

import { Constructor, OwnerAddress } from '../types'

export interface EOAAdapter {
  init(chainId: number, rpcTarget: string): Promise<void>
  logout(): Promise<void>
  connect(): Promise<void>
  getAccount(): Promise<OwnerAddress | null>
  getSigner(): ethers.Signer | null
}
export type EOAConstructor = Constructor<EOAAdapter>
