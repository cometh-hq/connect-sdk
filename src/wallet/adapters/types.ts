import { JsonRpcSigner } from '@ethersproject/providers'
import { Wallet } from 'ethers'

import { WebAuthnSigner } from '../signers'
import { NewSignerRequest, UserInfos } from '../types'

export interface AUTHAdapter {
  logout(): Promise<void>
  connect(): Promise<void>
  getAccount(): Promise<string | null>
  getSigner(): JsonRpcSigner | Wallet | WebAuthnSigner
  getWalletAddress(): Promise<string>
  getUserInfos(): Promise<Partial<UserInfos>>
  createNewSignerRequest(): Promise<void>
  getNewSignerRequestByUser(): Promise<NewSignerRequest[] | null>
  deleteNewSignerRequest(signerAddress: string): Promise<void>
  deployWebAuthnSigner(newSignerRequest: NewSignerRequest): Promise<string>
  readonly chainId: string
}

export type Constructor<T> = new (...args: any[]) => T
