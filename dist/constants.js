"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.P256SignerCreationCode = exports.EIP712_SAFE_TX_TYPES = exports.EIP712_SAFE_MESSAGE_TYPE = exports.BLOCK_EVENT_GAP = exports.DEFAULT_REWARD_PERCENTILE = exports.DEFAULT_BASE_GAS = exports.networks = exports.DEFAULT_RPC_TARGET = exports.DEFAULT_CHAIN_ID = exports.API_URL = void 0;
exports.API_URL = 
/* 'https://account-abstraction.api.alembic.tech/' */ 'http://localhost:3000/';
exports.DEFAULT_CHAIN_ID = 137;
exports.DEFAULT_RPC_TARGET = 'https://polygon-rpc.com';
exports.networks = {
    // Default network: Polygon
    137: {
        RPCUrl: process.env.RPC_URL_POLYGON || 'https://polygon-rpc.com',
        networkName: 'Polygon',
        P256FactoryContractAddress: '0x7Dd57c4113477c0710c1F043Df900ca1c6AcE922'
    },
    80001: {
        RPCUrl: process.env.RPC_URL_MUMBAI || 'https://rpc-mumbai.maticvigil.com',
        networkName: 'Mumbai',
        P256FactoryContractAddress: '0x1F944424217a962b6001Db9F44a2C87e37865790'
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
exports.P256SignerCreationCode = '0x60c060405234801561001057600080fd5b506040516107d73803806107d783398101604081905261002f9161003d565b60809190915260a052610061565b6000806040838503121561005057600080fd5b505080516020909101519092909150565b60805160a0516107456100926000396000818160e70152610211015260008181605601526101eb01526107456000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c80630c55699c146100515780631626ba7e1461008b57806320c13b0b146100cf578063a56dfe4a146100e2575b600080fd5b6100787f000000000000000000000000000000000000000000000000000000000000000081565b6040519081526020015b60405180910390f35b61009e61009936600461041b565b610109565b6040517fffffffff000000000000000000000000000000000000000000000000000000009091168152602001610082565b61009e6100dd366004610462565b61015e565b6100787f000000000000000000000000000000000000000000000000000000000000000081565b60006101368360405160200161012191815260200190565b60405160208183030381529060405283610192565b507f1626ba7e0000000000000000000000000000000000000000000000000000000092915050565b600061016a8383610192565b507f20c13b0b0000000000000000000000000000000000000000000000000000000092915050565b600080600080848060200190518101906101ac919061052d565b9350935093509350600073DF8787984c565dA498774c8b4c0c50285cE01667630d5efec9866001878b80519060200120888860405180604001604052807f000000000000000000000000000000000000000000000000000000000000000081526020017f00000000000000000000000000000000000000000000000000000000000000008152506040518863ffffffff1660e01b8152600401610255979695949392919061065e565b602060405180830381865af4158015610272573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061029691906106e6565b9050806102cf576040517f8baa579f00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b50505050505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6040805190810167ffffffffffffffff8111828210171561032a5761032a6102d8565b60405290565b604051601f82017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe016810167ffffffffffffffff81118282101715610377576103776102d8565b604052919050565b600067ffffffffffffffff821115610399576103996102d8565b50601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe01660200190565b600082601f8301126103d657600080fd5b81356103e96103e48261037f565b610330565b8181528460208386010111156103fe57600080fd5b816020850160208301376000918101602001919091529392505050565b6000806040838503121561042e57600080fd5b82359150602083013567ffffffffffffffff81111561044c57600080fd5b610458858286016103c5565b9150509250929050565b6000806040838503121561047557600080fd5b823567ffffffffffffffff8082111561048d57600080fd5b610499868387016103c5565b935060208501359150808211156104af57600080fd5b50610458858286016103c5565b60005b838110156104d75781810151838201526020016104bf565b50506000910152565b600082601f8301126104f157600080fd5b81516104ff6103e48261037f565b81815284602083860101111561051457600080fd5b6105258260208301602087016104bc565b949350505050565b60008060008060a0858703121561054357600080fd5b845167ffffffffffffffff8082111561055b57600080fd5b610567888389016104e0565b955060209150818701518181111561057e57600080fd5b61058a89828a016104e0565b955050506040860151925086607f8701126105a457600080fd5b6105ac610307565b8060a08801898111156105be57600080fd5b606089015b818110156105da57805184529284019284016105c3565b505080935050505092959194509250565b600081518084526106038160208601602086016104bc565b601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0169290920160200192915050565b8060005b6002811015610658578151845260209384019390910190600101610639565b50505050565b60006101208083526106728184018b6105eb565b90507fff000000000000000000000000000000000000000000000000000000000000008960f81b16602084015282810360408401526106b181896105eb565b9150508560608301528460808301526106cd60a0830185610635565b6106da60e0830184610635565b98975050505050505050565b6000602082840312156106f857600080fd5b8151801515811461070857600080fd5b939250505056fea26469706673582212206ca06df4e3fb2912f4da5f84dcb68b73c9ceae247b7fcf494ad37a26bbce2f9664736f6c63430008110033';
