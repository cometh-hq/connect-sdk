import { Web3Provider } from '@ethersproject/providers'
import { BigNumber, Bytes } from 'ethers'

import { SafeInterface } from '../contracts/types/Safe'
import { EOAConstructor } from './adapters'
import {
  SafeTransactionDataPartial,
  SendTransactionResponse,
  TransactionStatus,
  UserInfos
} from './types'
export interface AlembicWalletConfig {
  eoaAdapter?: EOAConstructor
  chainId?: number
  rpcTarget?: string
  apiKey: string
}
export declare class AlembicWallet {
  private eoaAdapter
  readonly chainId: number
  private rpcTarget
  private connected
  private BASE_GAS
  private REWARD_PERCENTILE
  private API
  private sponsoredAddresses?
  private smartWalletAddress?
  readonly SafeInterface: SafeInterface
  constructor({ eoaAdapter, chainId, rpcTarget, apiKey }: AlembicWalletConfig)
  /**
   * Connection Section
   */
  connect(): Promise<void>
  getConnected(): boolean
  isDeployed(): Promise<boolean>
  getUserInfos(): Promise<UserInfos>
  getSmartWalletAddress(): string
  private _createMessage
  logout(): Promise<void>
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
    safeTxData: SafeTransactionDataPartial
  ): Promise<SendTransactionResponse>
  getRelayTxStatus(relayId: string): Promise<TransactionStatus>
  getTransactionHash(
    safeTxData: SafeTransactionDataPartial,
    nonce: number
  ): Promise<string>
}
