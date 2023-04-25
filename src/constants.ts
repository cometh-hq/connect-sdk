export const WEB3AUTH_CLIENT_ID =
  'BH6A9sDxfEZQ96_dg9ret3NDZgwMjR-yArysjLff1oMCJQ3stc1J-yPXoUdf_zCzTt8A22D3McrFBy3eYKp4jnw'
export const API_URL = 'https://alembic-api.develop.cometh.tech'
export const DEFAULT_CHAIN_ID = 137
export const DEFAULT_RPC_TARGET = 'https://polygon-rpc.com'
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
