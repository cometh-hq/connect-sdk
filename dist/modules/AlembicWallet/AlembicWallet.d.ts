import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'

import { EOAConstructor } from '../../adapters'
import { TransactionStatus, UserInfos } from '../../types'

export declare class AlembicWallet {
  private eoaAdapter
  private chainId
  private rpcTarget
  private connected
  private smartWalletAddress
  private ethProvider
  private smartWallet
  private ownerAddress
  constructor(eoaAdapter?: EOAConstructor, chainId?: number, rpcTarget?: string)
  connect(): Promise<void>
  getConnected(): boolean
  logout(): Promise<void>
  private createMessage
  sendTransaction(
    safeTxData: SafeTransactionDataPartial
  ): Promise<string | null>
  getRelayTxStatus(relayId: string): Promise<TransactionStatus | null>
  getUserInfos(): Promise<UserInfos>
  getOwnerAddress(): string | null
  getSmartWalletAddress(): string | null
  signMessage(messageToSign: string): Promise<string | undefined>
}
