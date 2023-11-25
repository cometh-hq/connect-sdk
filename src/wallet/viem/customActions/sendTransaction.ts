import { deepHexlify } from '@alchemy/aa-core'
import { MetaTransaction } from 'ethers-multisend'
import { Hash } from 'viem'

import { isMetaTransactionArray } from '../../../utils/utils'
import { ComethWallet } from '../../ComethWallet'

export const sendTransaction = async (
  wallet: ComethWallet,
  safeTxData: MetaTransaction | MetaTransaction[]
): Promise<Hash> => {
  let result
  if (isMetaTransactionArray(safeTxData)) {
    result = await wallet.sendBatchTransactions(deepHexlify(safeTxData))
  } else {
    result = await wallet.sendTransaction(deepHexlify(safeTxData))
  }

  return result.safeTxHash as Hash
}
