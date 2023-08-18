import { JsonRpcSigner } from '@ethersproject/providers'
import { Wallet } from 'ethers'

import {
  AlembicAuthSigner,
  PassEncodedSigner,
  WebAuthnSigner
} from '../signers'
import { UserInfos } from '../types'

export interface AUTHAdapter {
  logout(): Promise<void>
  connect(userId?: string): Promise<void>
  getAccount(): Promise<string | null>
  getSigner():
    | JsonRpcSigner
    | Wallet
    | AlembicAuthSigner
    | WebAuthnSigner
    | PassEncodedSigner
  getUserInfos(): Promise<Partial<UserInfos>>
  readonly chainId: string
}

export type Constructor<T> = new (...args: any[]) => T
