import { WalletInit, WalletInterface, WalletModule } from '@web3-onboard/common'
import { ethers } from 'ethers'

import { AUTHAdapter } from '../adapters'
import { ComethProvider } from '../ComethProvider'
import { ComethWallet } from '../ComethWallet'
import { WalletUiConfig } from '../types'

export function ConnectOnboardConnector({
  apiKey,
  authAdapter,
  rpcUrl,
  uiConfig
}: {
  apiKey: string
  authAdapter: AUTHAdapter
  rpcUrl?: string
  uiConfig?: WalletUiConfig
}): WalletInit {
  return (): WalletModule => {
    return {
      label: 'Connect SDK',
      getIcon: async () =>
        (await import('../../ui/images/comethLogoDark')).default,
      getInterface: async (): Promise<WalletInterface> => {
        const { createEIP1193Provider } = await import('@web3-onboard/common')

        const instance = new ComethWallet({
          authAdapter,
          apiKey,
          rpcUrl,
          ...(uiConfig ?? { uiConfig })
        })
        const instanceProvider = new ComethProvider(instance)
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