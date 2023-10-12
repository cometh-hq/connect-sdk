export const API_URL = 'https://api.connect.cometh.io/'
export const DEFAULT_CHAIN_ID = 137
export const DEFAULT_RPC_TARGET = 'https://polygon-rpc.com'
export const networks = {
  // Default network: Polygon
  137: {
    RPCUrl: process.env.RPC_URL_POLYGON || 'https://polygon-rpc.com',
    networkName: 'Polygon'
  },
  80001: {
    RPCUrl: process.env.RPC_URL_MUMBAI || 'https://rpc-mumbai.maticvigil.com',
    networkName: 'Mumbai'
  },
  43114: {
    RPCUrl:
      process.env.RPC_URL_AVALANCHE ||
      'https://avalanche-mainnet.infura.io/v3/5eba3fe58b4646c89a0e3fad285769d4',
    networkName: 'Avalanche'
  },
  43113: {
    RPCUrl:
      process.env.RPC_URL_FUJI ||
      'https://avalanche-fuji.infura.io/v3/5eba3fe58b4646c89a0e3fad285769d4',
    networkName: 'Fuji'
  },
  100: {
    RPCUrl: process.env.RPC_URL_GNOSIS || 'https://rpc.ankr.com/gnosis',
    networkName: 'Gnosis Chain'
  },
  10200: {
    RPCUrl: process.env.RPC_URL_CHIADO || 'https://rpc.chiadochain.net',
    networkName: 'Chiado Chain'
  },
  1442: {
    RPCUrl:
      process.env.RPC_URL_POLYGON_ZKEVM_TESTNET ||
      'https://rpc.public.zkevm-test.net',
    networkName: 'Polygon zkEVM Testnet'
  }
}
export const GAS_GAP_TOLERANCE = 10
export const DEFAULT_BASE_GAS = 80000
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

export const Pbkdf2Iterations = Number(process.env.PBKDF2_ITERATIONS) || 1000000

export const ADD_OWNER_FUNCTION_SELECTOR = '0x0d582f13'
