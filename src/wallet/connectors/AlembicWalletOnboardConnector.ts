import { WalletInit, WalletInterface, WalletModule } from '@web3-onboard/common'
import { ethers } from 'ethers'

import { AUTHAdapter } from '../adapters'
import { AlembicProvider } from '../AlembicProvider'
import { AlembicWallet } from '../AlembicWallet'
import { WalletUiConfig } from '../types'

export function AlembicWalletOnboardConnector({
  apiKey,
  authAdapter,
  walletId,
  rpcUrl,
  uiConfig
}: {
  apiKey: string
  authAdapter: AUTHAdapter
  walletId: string
  rpcUrl?: string
  uiConfig?: WalletUiConfig
}): WalletInit {
  return (): WalletModule => {
    return {
      label: 'Alembic Connect',
      getIcon: async () =>
        (await import('../../ui/images/alembicLogoDark')).default,
      getInterface: async (): Promise<WalletInterface> => {
        const { createEIP1193Provider } = await import('@web3-onboard/common')

        const instance = new AlembicWallet({
          authAdapter,
          apiKey,
          rpcUrl,
          ...(uiConfig ?? { uiConfig })
        })
        const instanceProvider = new AlembicProvider(instance)
        await instance.connect(walletId)

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
          },
          eth_accounts: async () => {
            return instanceProvider.eth_accounts()
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
