import type { WalletInit } from '@web3-onboard/common'

import { AUTHAdapter } from '../adapters'
export declare function AlembicWalletOnboardConnector({
  apiKey,
  authAdapter
}: {
  apiKey: string
  authAdapter: AUTHAdapter
}): WalletInit
