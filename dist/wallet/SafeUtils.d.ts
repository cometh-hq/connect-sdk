import { StaticJsonRpcProvider } from '@ethersproject/providers'

import { AlembicProvider } from './AlembicProvider'
import { SafeTransactionDataPartial } from './types'
declare const _default: {
  isDeployed: (
    walletAddress: string,
    provider: StaticJsonRpcProvider | AlembicProvider
  ) => Promise<boolean>
  getNonce: (
    walletAddress: string,
    provider: StaticJsonRpcProvider | AlembicProvider
  ) => Promise<number>
  getSuccessExecTransactionEvent: (
    safeTxHash: string,
    walletAddress: string,
    provider: StaticJsonRpcProvider | AlembicProvider
  ) => Promise<any>
  getFailedExecTransactionEvent: (
    safeTxHash: string,
    walletAddress: string,
    provider: StaticJsonRpcProvider | AlembicProvider
  ) => Promise<any>
  formatWebAuthnSignatureForSafe: (
    signerAddress: string,
    signature: string
  ) => string
  getSafeTransactionHash: (
    walletAddress: string,
    transactionData: SafeTransactionDataPartial,
    chainId: number
  ) => string
}
export default _default
