import {
  Address,
  CustomSource,
  Hash,
  PrivateKeyAccount,
  SignableMessage,
  toHex
} from 'viem'
import { toAccount } from 'viem/accounts'

import { ComethWallet } from '../ComethWallet'

export const getViemAccount = async (
  ComethWallet: ComethWallet
): Promise<PrivateKeyAccount> => {
  const address = (await ComethWallet.getAddress()) as Address
  const source: CustomSource = {
    address,
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
        value: toHex(transaction.value as bigint),
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

  return {
    ...toAccount(source),
    publicKey: address,
    source: 'privateKey'
  }
}
