import { JsonRpcSigner } from '@ethersproject/providers'
import { Wallet } from 'ethers'

import { WebAuthnSigner } from '../signers'
import { UserInfos } from '../types'

export interface AUTHAdapter {
  logout(): Promise<void>
  connect(walletAddress?: string): Promise<void>
  getAccount(): Promise<string | null>
  getSigner(): JsonRpcSigner | Wallet | WebAuthnSigner
  getWalletAddress(): string
  getUserInfos(): Promise<Partial<UserInfos>>
  readonly chainId: string
}

export type Constructor<T> = new (...args: any[]) => T
