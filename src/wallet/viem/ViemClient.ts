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
import { muster } from './customChains'

const supportedChains = [
  polygon,
  polygonMumbai,
  avalanche,
  avalancheFuji,
  gnosis,
  gnosisChiado,
  polygonZkEvm,
  polygonZkEvmTestnet,
  muster
]

export const ViemClient = async (
  wallet: ComethWallet,
  rpc?: string
): Promise<PublicClient<Transport, Chain>> => {
  /* eslint-disable */
  /* @ts-ignore */
  const chain = extractChain({
    chains: supportedChains,
    id: wallet.chainId as any
  })

  const client = createPublicClient({
    chain,
    transport: http(rpc)
    /* eslint-disable */
    /* @ts-ignore */
  }).extend(comethWalletActions(wallet))

  return client
}
