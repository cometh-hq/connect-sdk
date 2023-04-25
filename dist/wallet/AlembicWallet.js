"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlembicWallet = void 0;
const ethers_1 = require("ethers");
const siwe_1 = require("siwe");
const constants_1 = require("../constants");
const Safe__factory_1 = require("../contracts/types/factories/Safe__factory");
const services_1 = require("../services");
const adapters_1 = require("./adapters");
class AlembicWallet {
    constructor({ eoaAdapter = adapters_1.Web3AuthAdapter, chainId = constants_1.DEFAULT_CHAIN_ID, rpcTarget = constants_1.DEFAULT_RPC_TARGET, apiKey }) {
        this.connected = false;
        // Contract Interfaces
        this.SafeInterface = Safe__factory_1.Safe__factory.createInterface();
        /**
         * Transaction Section
         */
        this._signTransaction = (safeTxData, nonce) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const signer = (_a = this.eoaAdapter.getEthProvider()) === null || _a === void 0 ? void 0 : _a.getSigner();
            if (!signer)
                throw new Error('Sign message: missing signer');
            return yield signer._signTypedData({
                chainId: this.chainId,
                verifyingContract: this.getAddress()
            }, constants_1.EIP712_SAFE_TX_TYPES, {
                to: safeTxData.to,
                value: ethers_1.BigNumber.from(safeTxData.value).toString(),
                data: safeTxData.data,
                operation: 0,
                safeTxGas: ethers_1.BigNumber.from(safeTxData.safeTxGas).toString(),
                baseGas: ethers_1.BigNumber.from(safeTxData.baseGas).toString(),
                gasPrice: ethers_1.BigNumber.from(safeTxData.gasPrice).toString(),
                gasToken: ethers_1.ethers.constants.AddressZero,
                refundReceiver: ethers_1.ethers.constants.AddressZero,
                nonce: ethers_1.BigNumber.from(nonce !== null && nonce !== void 0 ? nonce : (yield this._getNonce())).toString()
            });
        });
        this._getNonce = () => __awaiter(this, void 0, void 0, function* () {
            return (yield this.isDeployed())
                ? (yield Safe__factory_1.Safe__factory.connect(this.getAddress(), this.getOwnerProvider()).nonce()).toNumber()
                : 0;
        });
        this.chainId = chainId;
        this.rpcTarget = rpcTarget;
        this.eoaAdapter = new eoaAdapter();
        this.API = new services_1.API(apiKey);
        this.BASE_GAS = constants_1.DEFAULT_BASE_GAS;
        this.REWARD_PERCENTILE = constants_1.DEFAULT_REWARD_PERCENTILE;
    }
    /**
     * Connection Section
     */
    connect() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            // Return if does not match requirements
            if (!this.eoaAdapter)
                throw new Error('No EOA adapter found');
            yield this.eoaAdapter.init(this.chainId, this.rpcTarget);
            yield this.eoaAdapter.connect();
            const signer = (_a = this.eoaAdapter.getEthProvider()) === null || _a === void 0 ? void 0 : _a.getSigner();
            if (!signer)
                throw new Error('No signer found');
            const ownerAddress = yield signer.getAddress();
            if (!ownerAddress)
                throw new Error('No ownerAddress found');
            const nonce = yield this.API.getNonce(ownerAddress);
            this.sponsoredAddresses = yield this.API.getSponsoredAddresses();
            const message = this._createMessage(ownerAddress, nonce);
            const messageToSign = message.prepareMessage();
            const signature = yield signer.signMessage(messageToSign);
            const walletAddress = yield ((_b = this.API) === null || _b === void 0 ? void 0 : _b.connectToAlembicWallet({
                message,
                signature,
                ownerAddress
            }));
            this.sponsoredAddresses = yield this.API.getSponsoredAddresses();
            this.connected = true;
            this.walletAddress = walletAddress;
        });
    }
    getConnected() {
        return this.connected;
    }
    isDeployed() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Safe__factory_1.Safe__factory.connect(this.getAddress(), this.getOwnerProvider()).deployed();
                return true;
            }
            catch (error) {
                return false;
            }
        });
    }
    getUserInfos() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.eoaAdapter)
                throw new Error('Cannot provide user infos');
            const userInfos = yield this.eoaAdapter.getUserInfos();
            return Object.assign(Object.assign({}, userInfos), { ownerAddress: yield ((_a = this.eoaAdapter.getSigner()) === null || _a === void 0 ? void 0 : _a.getAddress()), walletAddress: this.getAddress() });
        });
    }
    getAddress() {
        var _a;
        return (_a = this.walletAddress) !== null && _a !== void 0 ? _a : '';
    }
    _createMessage(address, nonce) {
        const domain = window.location.host;
        const origin = window.location.origin;
        const statement = `Sign in with Ethereum to Alembic`;
        const message = new siwe_1.SiweMessage({
            domain,
            address,
            statement,
            uri: origin,
            version: '1',
            chainId: this.chainId,
            nonce: nonce === null || nonce === void 0 ? void 0 : nonce.connectionNonce
        });
        return message;
    }
    logout() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.eoaAdapter)
                throw new Error('No EOA adapter found');
            yield this.eoaAdapter.logout();
            this.connected = false;
        });
    }
    addOwner(newOwner) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = {
                to: this.getAddress(),
                value: '0x0',
                data: this.SafeInterface.encodeFunctionData('addOwnerWithThreshold', [
                    newOwner,
                    1
                ])
            };
            this.sendTransaction(tx);
        });
    }
    /**
     * Signing Message Section
     */
    getOwnerProvider() {
        const provider = this.eoaAdapter.getEthProvider();
        if (!provider)
            throw new Error('getOwnerProvider: missing provider');
        return provider;
    }
    signMessage(messageToSign) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const signer = (_a = this.eoaAdapter.getEthProvider()) === null || _a === void 0 ? void 0 : _a.getSigner();
            if (!signer)
                throw new Error('Sign message: missing signer');
            const messageHash = ethers_1.ethers.utils.hashMessage(messageToSign);
            const signature = yield signer._signTypedData({
                verifyingContract: this.getAddress(),
                chainId: this.chainId
            }, constants_1.EIP712_SAFE_MESSAGE_TYPE, { message: messageHash });
            return signature;
        });
    }
    _toSponsoredAddress(targetAddress) {
        var _a;
        const sponsoredAddress = (_a = this.sponsoredAddresses) === null || _a === void 0 ? void 0 : _a.find((sponsoredAddress) => sponsoredAddress.targetAddress === targetAddress);
        return sponsoredAddress ? true : false;
    }
    _estimateTransactionGas(safeTxData) {
        return __awaiter(this, void 0, void 0, function* () {
            const safeTxGas = yield this.getOwnerProvider().estimateGas({
                from: this.getAddress(),
                to: safeTxData.to,
                value: safeTxData.value,
                data: safeTxData.data
            });
            const ethFeeHistory = yield this.getOwnerProvider().send('eth_feeHistory', [
                1,
                'latest',
                [this.REWARD_PERCENTILE]
            ]);
            const [reward, BaseFee] = [
                ethers_1.BigNumber.from(ethFeeHistory.reward[0][0]),
                ethers_1.BigNumber.from(ethFeeHistory.baseFeePerGas[0])
            ];
            return {
                safeTxGas,
                baseGas: this.BASE_GAS,
                gasPrice: reward.add(BaseFee)
            };
        });
    }
    sendTransaction(safeTxData) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const nonce = yield this._getNonce();
            const safeTxDataTyped = {
                to: safeTxData.to,
                value: (_a = safeTxData.value) !== null && _a !== void 0 ? _a : 0,
                data: safeTxData.data,
                operation: 0,
                safeTxGas: 0,
                baseGas: 0,
                gasPrice: 0,
                gasToken: ethers_1.ethers.constants.AddressZero,
                refundReceiver: ethers_1.ethers.constants.AddressZero,
                nonce
            };
            if (!this._toSponsoredAddress(safeTxDataTyped.to)) {
                const { safeTxGas, baseGas, gasPrice } = yield this._estimateTransactionGas(safeTxDataTyped);
                safeTxDataTyped.safeTxGas = +safeTxGas;
                safeTxDataTyped.baseGas = baseGas;
                safeTxDataTyped.gasPrice = +gasPrice;
            }
            const signature = yield this._signTransaction(safeTxDataTyped, nonce);
            const safeTxHash = yield this.API.relayTransaction({
                safeTxData: safeTxDataTyped,
                signatures: signature,
                walletAddress: this.getAddress()
            });
            return { safeTxHash };
        });
    }
    getExecTransactionEvent(safeTxHash) {
        return __awaiter(this, void 0, void 0, function* () {
            const safeInstance = yield Safe__factory_1.Safe__factory.connect(this.getAddress(), this.getOwnerProvider());
            const transactionEvents = yield safeInstance.queryFilter(safeInstance.filters.ExecutionSuccess(), constants_1.BLOCK_EVENT_GAP);
            const filteredTransactionEvent = transactionEvents.filter((e) => e.args.txHash === safeTxHash);
            return filteredTransactionEvent[0];
        });
    }
}
exports.AlembicWallet = AlembicWallet;
