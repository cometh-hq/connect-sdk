import type { WalletInit } from '@web3-onboard/common'

import { EOAAdapter } from '../adapters'
export declare function AlembicWalletOnboardConnector(
  apiKey: string,
  chainId: number,
  rpcTarget: string,
  eoaAdapter?: EOAAdapter
): WalletInit
