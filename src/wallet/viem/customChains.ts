import { defineChain } from 'viem'

/* eslint-disable */
/* @ts-ignore */
export const musterTestnet = defineChain({
  id: 2121337,
  name: 'Muster Testnet',
  network: 'musterTestnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH'
  },
  rpcUrls: {
    default: {
      http: [
        process.env.RPC_URL_MUSTER_TESTNET ||
          'https://muster-anytrust.alt.technology'
      ]
    },
    public: {
      http: [
        process.env.RPC_URL_MUSTER_TESTNET ||
          'https://muster-anytrust.alt.technology'
      ]
    }
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 5882
    }
  }
})
