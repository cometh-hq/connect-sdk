import { JsonRpcSigner } from '@ethersproject/providers'
import { Wallet } from 'ethers'

import {
  AlembicAuthSigner,
  PassEncodedSigner,
  WebAuthnSigner
} from '../signers'
import { AlembicInitOptions, UserInfos } from '../types'

export interface AUTHAdapter {
  logout(): Promise<void>
  connect(alembicInitOptions?: AlembicInitOptions): Promise<void>
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
