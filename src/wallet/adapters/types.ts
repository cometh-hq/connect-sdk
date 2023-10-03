import { JsonRpcSigner } from '@ethersproject/providers'
import { Wallet } from 'ethers'

import { WebAuthnSigner } from '../signers'
import { NewSignerRequest, NewSignerRequestBody, UserInfos } from '../types'

export interface AUTHAdapter {
  logout(): Promise<void>
  connect(injectedWalletAddress?: string): Promise<void>
  getAccount(): Promise<string | null>
  getSigner(): JsonRpcSigner | Wallet | WebAuthnSigner
  getWalletAddress(): Promise<string>
  getUserInfos(): Promise<Partial<UserInfos>>
  createNewSignerRequest(
    walletAddress: string,
    userName?: string
  ): Promise<NewSignerRequestBody>
  getNewSignerRequestsByWallet(): Promise<NewSignerRequest[] | null>
  createNewSignerRequestByToken(): Promise<void>
  deleteNewSignerRequestByToken(signerAddress: string): Promise<void>
  deployWebAuthnSignerByToken(
    newSignerRequest: NewSignerRequest
  ): Promise<string>
  readonly chainId: string
}

export type Constructor<T> = new (...args: any[]) => T
