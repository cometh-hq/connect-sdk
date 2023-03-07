import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'

export interface SmartWallet {
  init(): Promise<void>
  sendTransaction: (tx: SafeTransactionDataPartial) => Promise<void>
}
