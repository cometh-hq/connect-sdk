import { Web3Provider } from '@ethersproject/providers'

import { AlembicProvider } from './AlembicProvider'
import { MetaTransactionData } from './types'
declare const _default: {
  isDeployed: (
    walletAddress: string,
    provider: Web3Provider | AlembicProvider
  ) => Promise<boolean>
  getNonce: (
    walletAddress: string,
    provider: Web3Provider | AlembicProvider
  ) => Promise<number>
  getSuccessExecTransactionEvent: (
    safeTxHash: string,
    walletAddress: string,
    provider: Web3Provider | AlembicProvider
  ) => Promise<any>
  getFailedExecTransactionEvent: (
    safeTxHash: string,
    walletAddress: string,
    provider: Web3Provider | AlembicProvider
  ) => Promise<any>
  formatWebAuthnSignatureForSafe: (
    signerAddress: string,
    signature: string
  ) => string
  getSafeTransactionHash: (
    walletAddress: string,
    transactionData: MetaTransactionData,
    chainId: number
  ) => string
}
export default _default
