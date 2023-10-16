import { ethers } from 'ethers'
import {
  Address,
  Chain,
  Client,
  createWalletClient,
  CustomSource,
  Hash,
  http,
  SignableMessage
} from 'viem'
import { toAccount } from 'viem/accounts'

import { ComethWallet } from '../ComethWallet'
import { SupportedNetworks } from '../types'

function _isSupportedNetwork(value: string): value is SupportedNetworks {
  return Object.values(SupportedNetworks).includes(value as any)
}

export async function comethClient(
  ComethWallet: ComethWallet,
  chain: Chain
): Promise<Client> {
  const chainId = ethers.utils.hexlify(chain.id)

  if (!_isSupportedNetwork(chainId)) {
    throw new Error('This network is not supported')
  }

  if (!ComethWallet.signer) {
    throw new Error('No signer found')
  }

  const source: CustomSource = {
    address: (await ComethWallet.signer.getAddress()) as Address,
    async signMessage({
      message
    }: {
      message: SignableMessage
    }): Promise<Hash> {
      const signedMessage = await ComethWallet.signMessage(message.toString())
      return `0x${signedMessage}`
    },
    async signTransaction(transaction): Promise<any> {
      const signedTransaction = await ComethWallet.signTransaction(
        transaction as any
      )
      return signedTransaction
    },
    /* eslint-disable */
    /* @ts-ignore */
    async signTypedData(typedData: any): Promise<Hash> {
      throw new Error('method not available')
    }
  }

  return createWalletClient({
    account: toAccount(source),
    chain,
    transport: http()
  })
}
