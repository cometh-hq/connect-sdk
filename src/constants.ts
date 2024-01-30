import { webAuthnOptions } from './wallet/types'

export const API_URL = 'https://api.connect.cometh.io/'
export const DEFAULT_CHAIN_ID = 137
export const DEFAULT_RPC_TARGET = 'https://polygon-rpc.com'
export const networks = {
  // Default network: Polygon
  137: {
    RPCUrl: process.env.RPC_URL_POLYGON || 'https://polygon-rpc.com',
    networkName: 'Polygon',
    currency: 'MATIC'
  },
  80001: {
    RPCUrl: process.env.RPC_URL_MUMBAI || 'https://rpc-mumbai.maticvigil.com',
    fallbackRPCUrl: [
      'https://rpc.ankr.com/polygon_mumbai',
      'https://polygon-mumbai-pokt.nodies.app'
    ],
    networkName: 'Mumbai',
    currency: 'MATIC'
  },
  43114: {
    RPCUrl:
      process.env.RPC_URL_AVALANCHE ||
      'https://avalanche-mainnet.infura.io/v3/5eba3fe58b4646c89a0e3fad285769d4',
    fallbackRPCUrl: ['https://avalanche.drpc.org', 'https://avax.meowrpc.com'],
    networkName: 'Avalanche',
    currency: 'AVAX'
  },
  43113: {
    RPCUrl:
      process.env.RPC_URL_FUJI ||
      'https://avalanche-fuji.infura.io/v3/5eba3fe58b4646c89a0e3fad285769d4',
    fallbackRPCUrl: ['https://avalanche-fuji-c-chain.publicnode.com'],
    networkName: 'Fuji',
    currency: 'AVAX'
  },
  100: {
    RPCUrl: process.env.RPC_URL_GNOSIS || 'https://rpc.gnosischain.com',
    networkName: 'Gnosis Chain',
    currency: 'xDai'
  },
  10200: {
    RPCUrl:
      process.env.RPC_URL_CHIADO ||
      'https://nd-244-554-535.p2pify.com/3e6f7fedad74cbc0637859cf91e7d676',
    networkName: 'Chiado Chain',
    currency: 'xDai'
  },
  2121337: {
    RPCUrl:
      process.env.RPC_URL_MUSTER_TESTNET ||
      'https://muster-anytrust.alt.technology',
    networkName: 'Muster Testnet',
    currency: 'ETH'
  },
  4078: {
    RPCUrl: process.env.RPC_URL_MUSTER || 'https://muster.alt.technology/',
    networkName: 'Muster',
    currency: 'ETH'
  },
  17001: {
    RPCUrl:
      process.env.RPC_URL_REDSTONE_HOLESKY ||
      'https://rpc.holesky.redstone.xyz',
    networkName: 'Redstone Holesky',
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

export const ADD_OWNER_FUNCTION_SELECTOR = '0x0d582f13'

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
