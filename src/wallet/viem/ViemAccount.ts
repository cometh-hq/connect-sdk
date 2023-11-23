import { utils } from 'ethers'
import {
  AccountSource,
  Address,
  CustomSource,
  Hash,
  SignableMessage
} from 'viem'
import { toAccount } from 'viem/accounts'

import { ComethWallet } from '../ComethWallet'

export async function ViemAccount(
  ComethWallet: ComethWallet
): Promise<AccountSource> {
  const source: CustomSource = {
    address: (await ComethWallet.getAddress()) as Address,
    async signMessage({
      message
    }: {
      message: SignableMessage
    }): Promise<Hash> {
      const signedMessage = await ComethWallet.signMessage(message.toString())
      return `0x${signedMessage}`
    },
    async signTransaction(transaction): Promise<any> {
      const safeTxDataTyped = await ComethWallet.constructTransaction({
        to: transaction.to as string,
        value: utils.hexlify(transaction.value as bigint),
        data: transaction.data as string
      })

      return await ComethWallet.signTransaction(safeTxDataTyped)
    },

    /* eslint-disable */
    /* @ts-ignore */
    async signTypedData({ domain, types, primaryType, message }) {
      throw new Error('method not available')
    }
  }

  return toAccount(source)
}
