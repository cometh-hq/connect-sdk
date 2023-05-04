import { Web3Provider } from '@ethersproject/providers'
import { BigNumber, Bytes } from 'ethers'

import { P256SignerFactoryInterface } from '../contracts/types/P256SignerFactory'
import { SafeInterface } from '../contracts/types/Safe'
import { AUTHAdapter } from './adapters'
import {
  MetaTransactionData,
  SafeTransactionDataPartial,
  SendTransactionResponse,
  UserInfos
} from './types'
export interface AlembicWalletConfig {
  authAdapter: AUTHAdapter
  apiKey: string
}
export declare class AlembicWallet {
  private authAdapter
  readonly chainId: number
  private connected
  private BASE_GAS
  private REWARD_PERCENTILE
  private API
  private sponsoredAddresses?
  private webAuthnOwners?
  private walletAddress?
  readonly SafeInterface: SafeInterface
  readonly P256FactoryContract: P256SignerFactoryInterface
  constructor({ authAdapter, apiKey }: AlembicWalletConfig)
  /**
   * Connection Section
   */
  connect(): Promise<void>
  getConnected(): boolean
  isDeployed(): Promise<boolean>
  getUserInfos(): Promise<UserInfos>
  getAddress(): string
  private _createMessage
  logout(): Promise<void>
  addOwner(newOwner: string): Promise<SendTransactionResponse>
  /**
   * Signing Message Section
   */
  getOwnerProvider(): Web3Provider
  signMessage(messageToSign: string | Bytes): Promise<string>
  /**
   * Transaction Section
   */
  private _signTransaction
  private _getNonce
  private _toSponsoredAddress
  _estimateTransactionGas(safeTxData: SafeTransactionDataPartial): Promise<{
    safeTxGas: BigNumber
    baseGas: number
    gasPrice: BigNumber
  }>
  sendTransaction(
    safeTxData: MetaTransactionData
  ): Promise<SendTransactionResponse>
  private getSafeTransactionHash
  getSuccessExecTransactionEvent(safeTxHash: string): Promise<any>
  getFailedExecTransactionEvent(safeTxHash: string): Promise<any>
  /**
   * WebAuthn Section
   */
  addWebAuthnOwner(): Promise<any>
  private getWebAuthnSigner
}
