import type {
  WalletInit,
  WalletInterface,
  WalletModule
} from '@web3-onboard/common'
import { ethers } from 'ethers'

import { AlembicProvider } from '../AlembicProvider'
import { AlembicWallet } from '../AlembicWallet'

export function AlembicWalletOnboardConnector(apiKey: string): WalletInit {
  return (): WalletModule => {
    return {
      label: 'alembicWallet',
      getIcon: async () => (await import('./icon')).default,
      getInterface: async (): Promise<WalletInterface> => {
        const { createEIP1193Provider } = await import('@web3-onboard/common')

        const instance = new AlembicWallet({ apiKey })
        const instanceProvider = new AlembicProvider(instance)
        await instance.connect()

        const provider = createEIP1193Provider(instanceProvider, {
          eth_requestAccounts: async () => {
            const address = instance.getAddress()
            return [address]
          },
          eth_chainId: async () => {
            return ethers.utils.hexlify(instance.chainId)
          },
          eth_getBalance: async () => {
            const balance = await instanceProvider.getSigner().getBalance()
            return balance?.toString() ?? '0'
          }
        })

        provider.disconnect = (): Promise<void> => instance.logout()

        return {
          provider,
          instance
        }
      }
    }
  }
}
