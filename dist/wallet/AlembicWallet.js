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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlembicWallet = void 0;
const safe_core_sdk_1 = __importDefault(require("@safe-global/safe-core-sdk"));
const safe_ethers_lib_1 = __importDefault(require("@safe-global/safe-ethers-lib"));
const ethers_1 = require("ethers");
const siwe_1 = require("siwe");
const constants_1 = require("../constants");
const services_1 = require("../services");
const AlembicProvider_1 = require("./AlembicProvider");
const adapters_1 = require("./adapters");
class AlembicWallet {
    constructor({ eoaAdapter = adapters_1.Web3AuthAdapter, chainId = constants_1.DEFAULT_CHAIN_ID, rpcTarget = constants_1.DEFAULT_RPC_TARGET, apiKey }) {
        this.connected = false;
        this.chainId = chainId;
        this.rpcTarget = rpcTarget;
        this.eoaAdapter = new eoaAdapter();
        this.API = new services_1.API(apiKey);
    }
    /**
     * Connection Section
     */
    connect() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // Return if does not match requirements
            if (!this.eoaAdapter)
                throw new Error('No EOA adapter found');
            yield this.eoaAdapter.init(this.chainId, this.rpcTarget);
            yield this.eoaAdapter.connect();
            const signer = this.getSigner();
            if (!signer)
                throw new Error('No signer found');
            const ownerAddress = yield signer.getAddress();
            if (!ownerAddress)
                throw new Error('No ownerAddress found');
            const nonce = yield this.API.getNonce(ownerAddress);
            const message = this._createMessage(ownerAddress, nonce);
            const messageToSign = message.prepareMessage();
            const signature = yield this.signMessage(messageToSign);
            const smartWalletAddress = yield ((_a = this.API) === null || _a === void 0 ? void 0 : _a.connectToAlembicWallet({
                message,
                signature,
                ownerAddress: ownerAddress
            }));
            const ethAdapter = new safe_ethers_lib_1.default({
                ethers: ethers_1.ethers,
                signerOrProvider: signer
            });
            this.safeSdk = yield safe_core_sdk_1.default.create({
                ethAdapter: ethAdapter,
                safeAddress: smartWalletAddress
            });
            this.connected = true;
        });
    }
    getConnected() {
        return this.connected;
    }
    getUserInfos() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.eoaAdapter)
                throw new Error('Cannot provide user infos');
            const userInfos = yield this.eoaAdapter.getUserInfos();
            return Object.assign(Object.assign({}, userInfos), { ownerAddress: yield ((_a = this.getSigner()) === null || _a === void 0 ? void 0 : _a.getAddress()), smartWalletAddress: this.getSmartWalletAddress() });
        });
    }
    getSmartWalletAddress() {
        var _a, _b;
        return (_b = (_a = this.safeSdk) === null || _a === void 0 ? void 0 : _a.getAddress()) !== null && _b !== void 0 ? _b : '';
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
    /**
     * Signing Section
     */
    getOwnerProvider() {
        const provider = this.eoaAdapter.getEthProvider();
        if (!provider)
            throw new Error('getOwnerProvider: missing provider');
        return provider;
    }
    getSigner() {
        var _a;
        return (_a = this.getOwnerProvider()) === null || _a === void 0 ? void 0 : _a.getSigner();
    }
    signMessage(messageToSign) {
        return __awaiter(this, void 0, void 0, function* () {
            const signer = this.getSigner();
            if (!signer)
                throw new Error('Sign message: missing signer');
            return yield signer.signMessage(messageToSign);
        });
    }
    /**
     * Transaction Section
     */
    sendTransaction(safeTxData) {
        var _a, _b, _c, _d, _e, _f, _g;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.safeSdk)
                throw new Error('No Safe SDK found');
            const safeTxDataTyped = {
                to: safeTxData.to,
                value: (_a = safeTxData.value) !== null && _a !== void 0 ? _a : 0,
                data: safeTxData.data,
                operation: (_b = safeTxData.operation) !== null && _b !== void 0 ? _b : 0,
                safeTxGas: (_c = safeTxData.safeTxGas) !== null && _c !== void 0 ? _c : 0,
                baseGas: (_d = safeTxData.baseGas) !== null && _d !== void 0 ? _d : 0,
                gasPrice: (_e = safeTxData.gasPrice) !== null && _e !== void 0 ? _e : 0,
                gasToken: (_f = safeTxData.gasToken) !== null && _f !== void 0 ? _f : ethers_1.ethers.constants.AddressZero,
                refundReceiver: (_g = safeTxData.refundReceiver) !== null && _g !== void 0 ? _g : ethers_1.ethers.constants.AddressZero
            };
            const safeTransaction = yield this.safeSdk.createTransaction({
                safeTransactionData: safeTxDataTyped
            });
            const safeTransactionHash = yield this.safeSdk.getTransactionHash(safeTransaction);
            const signature = yield this.safeSdk.signTypedData(safeTransaction);
            const relayId = yield this.API.relayTransaction({
                safeTxData: safeTxDataTyped,
                signatures: signature.data,
                smartWalletAddress: this.safeSdk.getAddress()
            });
            return { relayId, safeTransactionHash };
        });
    }
    getRelayTxStatus(relayId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.API.getRelayTxStatus(relayId);
        });
    }
    waitRelay(relayId) {
        return __awaiter(this, void 0, void 0, function* () {
            const provider = new AlembicProvider_1.AlembicProvider(this);
            const tx = yield provider.getTransaction(relayId);
            return yield tx.wait();
        });
    }
}
exports.AlembicWallet = AlembicWallet;
