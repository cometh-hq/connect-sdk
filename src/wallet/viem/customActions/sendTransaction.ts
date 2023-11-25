import { deepHexlify } from '@alchemy/aa-core'
import { MetaTransaction } from 'ethers-multisend'
import { Hash } from 'viem'

import { ComethWallet } from '../../ComethWallet'

export const sendTransaction = async (
  wallet: ComethWallet,
  safeTxData: MetaTransaction
): Promise<Hash> => {
  const result = await wallet.sendTransaction(deepHexlify(safeTxData))

  return result.safeTxHash as Hash
}
