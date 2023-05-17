import { WalletInit } from '@web3-onboard/common'

import { AUTHAdapter } from '../adapters'
import { WalletUiConfig } from '../types'
export declare function AlembicWalletOnboardConnector({
  apiKey,
  authAdapter,
  uiConfig
}: {
  apiKey: string
  authAdapter: AUTHAdapter
  uiConfig?: WalletUiConfig
}): WalletInit
