import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'

import { EOAConstructor } from '../../adapters'
import { TransactionStatus, UserInfos } from '../../types'
import { AlembicProvider } from '../AlembicProvider'

export interface AlembicWalletConfig {
  eoaAdapter?: EOAConstructor
  chainId?: number
  rpcTarget?: string
  apiKey: string
}
export declare class AlembicWallet {
  private eoaAdapter
  private chainId
  private rpcTarget
  private connected
  private smartWalletAddress
  private ethProvider
  private smartWallet
  private ownerAddress
  private apiKey
  private API
  constructor({ eoaAdapter, chainId, rpcTarget, apiKey }: AlembicWalletConfig)
  connect(): Promise<void>
  getConnected(): boolean
  logout(): Promise<void>
  private createMessage
  sendTransaction(
    safeTxData: SafeTransactionDataPartial
  ): Promise<string | null>
  waitForTxToBeMined(relayId: string): Promise<boolean>
  getRelayTxStatus(
    relayId: string
  ): Promise<TransactionStatus | null | undefined>
  getUserInfos(): Promise<UserInfos>
  getOwnerAddress(): string | null
  getSmartWalletAddress(): string | null
  signMessage(messageToSign: string): Promise<string | undefined>
  getProvider(): AlembicProvider
}
