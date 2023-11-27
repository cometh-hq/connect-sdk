import {
  Chain,
  createPublicClient,
  extractChain,
  http,
  PublicClient,
  Transport
} from 'viem'
import {
  avalanche,
  avalancheFuji,
  gnosis,
  gnosisChiado,
  polygon,
  polygonMumbai,
  polygonZkEvm,
  polygonZkEvmTestnet
} from 'viem/chains'

import { ComethWallet } from '../ComethWallet'
import { comethWalletActions } from './customActions'
import { musterTestnet } from './customChains'

const supportedChains = [
  polygon,
  polygonMumbai,
  avalanche,
  avalancheFuji,
  gnosis,
  gnosisChiado,
  polygonZkEvm,
  polygonZkEvmTestnet,
  musterTestnet
]

export const ViemClient = async (
  wallet: ComethWallet,
  rpc?: string
): Promise<PublicClient<Transport, Chain>> => {
  const chain: Chain = extractChain({
    chains: supportedChains,
    id: wallet.chainId as any
  })

  return createPublicClient({
    chain,
    transport: http(rpc)
    /* eslint-disable */
    /* @ts-ignore */
  }).extend(comethWalletActions(wallet))
}
