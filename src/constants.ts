import { webAuthnOptions } from './wallet/types'

export const API_URL = 'https://api.connect.cometh.io/'
export const DEFAULT_CHAIN_ID = 137
export const DEFAULT_RPC_TARGET = 'https://polygon-rpc.com'
export const networks = {
  // Default network: Polygon
  137: {
    RPCUrl: 'https://polygon-rpc.com',
    networkName: 'Polygon',
    currency: 'MATIC'
  },
  80001: {
    RPCUrl: 'https://rpc-mumbai.maticvigil.com',
    networkName: 'Mumbai',
    currency: 'MATIC'
  },
  80002: {
    RPCUrl: 'https://rpc-amoy.polygon.technology',
    networkName: 'Amoy',
    currency: 'MATIC'
  },
  43114: {
    RPCUrl: 'https://avalanche.drpc.org',
    networkName: 'Avalanche',
    currency: 'AVAX'
  },
  43113: {
    RPCUrl: 'https://avalanche-fuji-c-chain-rpc.publicnode.com',
    networkName: 'Fuji',
    currency: 'AVAX'
  },
  3084: {
    RPCUrl: '',
    networkName: 'XL network',
    currency: 'XL'
  },
  100: {
    RPCUrl: 'https://rpc.gnosischain.com',
    networkName: 'Gnosis Chain',
    currency: 'xDai'
  },
  10200: {
    RPCUrl:
      'https://nd-244-554-535.p2pify.com/3e6f7fedad74cbc0637859cf91e7d676',
    networkName: 'Chiado Chain',
    currency: 'xDai'
  },
  4078: {
    RPCUrl: 'https://muster.alt.technology/',
    networkName: 'Muster',
    currency: 'ETH'
  },
  2121337: {
    RPCUrl: 'https://muster-anytrust.alt.technology',
    networkName: 'Muster Testnet',
    currency: 'ETH'
  },
  17001: {
    RPCUrl: 'https://rpc.holesky.redstone.xyz',
    networkName: 'Redstone Holesky',
    currency: 'ETH'
  },
  10: {
    RPCUrl: 'https://mainnet.optimism.io',
    networkName: 'Optimism',
    currency: 'ETH'
  },
  11155420: {
    RPCUrl: 'https://sepolia.optimism.io/',
    networkName: 'Optimism sepolia',
    currency: 'ETH'
  },
  42161: {
    RPCUrl: 'https://arb1.arbitrum.io/rpc',
    networkName: 'Arbitrum One',
    currency: 'ETH'
  },
  421614: {
    RPCUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    networkName: 'Arbitrum sepolia',
    currency: 'ETH'
  },
  8453: {
    RPCUrl: 'https://mainnet.base.org',
    networkName: 'Base',
    currency: 'ETH'
  },
  84532: {
    RPCUrl: 'https://sepolia.base.org',
    networkName: 'Base sepolia',
    currency: 'ETH'
  }
}
export const GAS_GAP_TOLERANCE = 10
export const DEFAULT_BASE_GAS_LOCAL_WALLET = 80000
export const DEFAULT_BASE_GAS_WEBAUTHN = 300000
export const DEFAULT_REWARD_PERCENTILE = 80
export const BLOCK_EVENT_GAP = -500
export const EIP712_SAFE_MESSAGE_TYPE = {
  // "SafeMessage(bytes message)"
  SafeMessage: [{ type: 'bytes', name: 'message' }]
}
export const EIP712_SAFE_TX_TYPES = {
  SafeTx: [
    { type: 'address', name: 'to' },
    { type: 'uint256', name: 'value' },
    { type: 'bytes', name: 'data' },
    { type: 'uint8', name: 'operation' },
    { type: 'uint256', name: 'safeTxGas' },
    { type: 'uint256', name: 'baseGas' },
    { type: 'uint256', name: 'gasPrice' },
    { type: 'address', name: 'gasToken' },
    { type: 'address', name: 'refundReceiver' },
    { type: 'uint256', name: 'nonce' }
  ]
}
export const challengePrefix = '226368616c6c656e6765223a'

export const importSafeMessage = 'Use my wallet with Cometh Connect'

export const defaultEncryptionSalt = 'COMETH-CONNECT'
export const Pbkdf2Iterations = 1000000

export const SAFE_SENTINEL_OWNERS = '0x1'

export const DEFAULT_WEBAUTHN_OPTIONS: webAuthnOptions = {
  // authenticatorSelection documentation can be found here: https://www.w3.org/TR/webauthn-2/#dictdef-authenticatorselectioncriteria
  authenticatorSelection: {
    authenticatorAttachment: 'platform',
    residentKey: 'preferred',
    userVerification: 'preferred'
  }
}

// 60 secondes
export const DEFAULT_CONFIRMATION_TIME = 60 * 1000
