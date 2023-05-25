import { WalletInit } from '@web3-onboard/common'

import { AUTHAdapter } from '../adapters'
import { WalletUiConfig } from '../types'
export declare function AlembicWalletOnboardConnector({
  apiKey,
  authAdapter,
  rpcUrl,
  uiConfig
}: {
  apiKey: string
  authAdapter: AUTHAdapter
  rpcUrl: string
  uiConfig?: WalletUiConfig
}): WalletInit
