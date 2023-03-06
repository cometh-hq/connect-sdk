import { ethers } from 'ethers'

import { OwnerAddress } from '../../types'
import { EOAAdapter } from '../types'

export declare class Web3AuthAdapter implements EOAAdapter {
  #private
  init(chainId: any, rpcTarget: any): Promise<void>
  connect(): Promise<void>
  logout(): Promise<void>
  getAccount(): Promise<OwnerAddress | null>
  getSigner(): ethers.Signer | null
}
