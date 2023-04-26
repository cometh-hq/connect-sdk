"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EIP712_SAFE_TX_TYPES = exports.EIP712_SAFE_MESSAGE_TYPE = exports.BLOCK_EVENT_GAP = exports.DEFAULT_REWARD_PERCENTILE = exports.DEFAULT_BASE_GAS = exports.networks = exports.DEFAULT_RPC_TARGET = exports.DEFAULT_CHAIN_ID = exports.API_URL = exports.WEB3AUTH_CLIENT_ID = void 0;
exports.WEB3AUTH_CLIENT_ID = 'BH6A9sDxfEZQ96_dg9ret3NDZgwMjR-yArysjLff1oMCJQ3stc1J-yPXoUdf_zCzTt8A22D3McrFBy3eYKp4jnw';
exports.API_URL = 'https://alembic-api.develop.cometh.tech';
exports.DEFAULT_CHAIN_ID = 137;
exports.DEFAULT_RPC_TARGET = 'https://polygon-rpc.com';
exports.networks = {
    // Default network: Polygon
    137: {
        RPCUrl: process.env.RPC_URL_POLYGON || 'https://polygon-rpc.com',
        networkName: 'Polygon'
    },
    80001: {
        RPCUrl: process.env.RPC_URL_MUMBAI || 'https://rpc-mumbai.maticvigil.com',
        networkName: 'Mumbai'
    }
};
exports.DEFAULT_BASE_GAS = 80000;
exports.DEFAULT_REWARD_PERCENTILE = 80;
exports.BLOCK_EVENT_GAP = -500;
exports.EIP712_SAFE_MESSAGE_TYPE = {
    // "SafeMessage(bytes message)"
    SafeMessage: [{ type: 'bytes', name: 'message' }]
};
exports.EIP712_SAFE_TX_TYPES = {
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
};
