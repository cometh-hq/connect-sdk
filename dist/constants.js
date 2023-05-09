"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EIP712_SAFE_TX_TYPES = exports.EIP712_SAFE_MESSAGE_TYPE = exports.BLOCK_EVENT_GAP = exports.DEFAULT_REWARD_PERCENTILE = exports.DEFAULT_BASE_GAS = exports.networks = exports.DEFAULT_RPC_TARGET = exports.DEFAULT_CHAIN_ID = exports.API_URL = void 0;
exports.API_URL = 'https://alembic-api.develop.cometh.tech';
exports.DEFAULT_CHAIN_ID = 137;
exports.DEFAULT_RPC_TARGET = 'https://polygon-rpc.com';
exports.networks = {
    // Default network: Polygon
    137: {
        RPCUrl: process.env.RPC_URL_POLYGON || 'https://polygon-rpc.com',
        networkName: 'Polygon',
        P256FactoryContractAddress: '0xdF51EE1ab0f0Ee8A128a7BCA2d7641636A1a7EC4'
    },
    80001: {
        RPCUrl: process.env.RPC_URL_MUMBAI || 'https://rpc-mumbai.maticvigil.com',
        networkName: 'Mumbai',
        P256FactoryContractAddress: '0x'
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
