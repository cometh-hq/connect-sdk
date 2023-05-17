import { Web3Provider } from '@ethersproject/providers'
import { BigNumber, Bytes } from 'ethers'

import { P256SignerFactoryInterface } from '../contracts/types/P256SignerFactory'
import { SafeInterface } from '../contracts/types/Safe'
import { AUTHAdapter } from './adapters'
import {
  MetaTransactionData,
  SafeTransactionDataPartial,
  SendTransactionResponse,
  UserInfos,
  WebAuthnOwner
} from './types'
export interface AlembicWalletConfig {
  authAdapter: AUTHAdapter
  apiKey: string
  uiConfig?: {
    displayValidationModal: boolean
  }
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
  private uiConfig
  readonly SafeInterface: SafeInterface
  readonly P256FactoryInterface: P256SignerFactoryInterface
  constructor({ authAdapter, apiKey }: AlembicWalletConfig)
  /**
   * Connection Section
   */
  connect(): Promise<void>
  getConnected(): boolean
  getUserInfos(): Promise<UserInfos>
  getAddress(): string
  private _createMessage
  private _getBalance
  logout(): Promise<void>
  addOwner(newOwner: string): Promise<SendTransactionResponse>
  /**
   * Signing Message Section
   */
  getOwnerProvider(): Web3Provider
  signMessage(messageToSign: string | Bytes): Promise<string>
  private _signMessageWithEOA
  /**
   * Transaction Section
   */
  signTransaction(safeTxData: SafeTransactionDataPartial): Promise<string>
  private _signTransactionWithEOA
  private _toSponsoredAddress
  _estimateTransactionGas(safeTxData: SafeTransactionDataPartial): Promise<{
    safeTxGas: BigNumber
    baseGas: number
    gasPrice: BigNumber
  }>
  private _calculateAndShowMaxFee
  sendTransaction(
    safeTxData: MetaTransactionData
  ): Promise<SendTransactionResponse>
  /**
   * WebAuthn Section
   */
  getCurrentWebAuthnOwner(): WebAuthnOwner | undefined
  addWebAuthnOwner(): Promise<string>
  private _verifyWebAuthnOwner
  private _signTransactionwithWebAuthn
  private _signMessageWithWebAuthn
}
