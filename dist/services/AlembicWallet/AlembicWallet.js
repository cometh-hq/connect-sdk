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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _AlembicWallet_eoaAdapter, _AlembicWallet_chainId, _AlembicWallet_rpcTarget, _AlembicWallet_isConnected;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlembicWallet = void 0;
const siwe_1 = require("siwe");
const adapters_1 = require("../../adapters");
const API_1 = require("../API/API");
class AlembicWallet {
    constructor(eoaAdapter, chainId = adapters_1.DEFAULT_CHAIN_ID, rpcTarget = adapters_1.DEFAULT_RPC_TARGET) {
        _AlembicWallet_eoaAdapter.set(this, void 0);
        _AlembicWallet_chainId.set(this, void 0);
        _AlembicWallet_rpcTarget.set(this, void 0);
        _AlembicWallet_isConnected.set(this, false);
        __classPrivateFieldSet(this, _AlembicWallet_chainId, chainId, "f");
        __classPrivateFieldSet(this, _AlembicWallet_rpcTarget, rpcTarget, "f");
        __classPrivateFieldSet(this, _AlembicWallet_eoaAdapter, new eoaAdapter(), "f");
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            // Return if does not match requirements
            if (!__classPrivateFieldGet(this, _AlembicWallet_eoaAdapter, "f"))
                throw new Error('No EOA adapter found');
            if (!__classPrivateFieldGet(this, _AlembicWallet_chainId, "f"))
                throw new Error('No chainId set');
            if (!__classPrivateFieldGet(this, _AlembicWallet_rpcTarget, "f"))
                throw new Error('No rpcUrl set');
            // Initialize EOA adapter
            yield __classPrivateFieldGet(this, _AlembicWallet_eoaAdapter, "f").init(__classPrivateFieldGet(this, _AlembicWallet_chainId, "f"), __classPrivateFieldGet(this, _AlembicWallet_rpcTarget, "f"));
            yield __classPrivateFieldGet(this, _AlembicWallet_eoaAdapter, "f").connect();
            // We get the user account
            const account = yield __classPrivateFieldGet(this, _AlembicWallet_eoaAdapter, "f").getAccount();
            if (!account)
                throw new Error('No account found');
            // We get the user nonce by calling AlembicAPI
            const nonce = yield API_1.API.getNonce(account);
            if (!nonce)
                throw new Error('No nonce found');
            // We prepare and sign a message, using siwe, in order to prove the user identity
            const message = this.createMessage(account, nonce);
            const messageToSign = message.prepareMessage();
            const signer = __classPrivateFieldGet(this, _AlembicWallet_eoaAdapter, "f").getSigner();
            if (!signer)
                throw new Error('No signer found');
            const signature = yield signer.signMessage(messageToSign);
            if (!signature)
                throw new Error('No signature found');
            const walletAddress = yield API_1.API.connectToAlembicWallet({
                message,
                signature,
                ownerAddress: account
            });
            if (!walletAddress)
                throw new Error('No wallet address found');
            if (walletAddress) {
                __classPrivateFieldSet(this, _AlembicWallet_isConnected, true, "f");
            }
        });
    }
    getIsConnected() {
        return __classPrivateFieldGet(this, _AlembicWallet_isConnected, "f");
    }
    logout() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!__classPrivateFieldGet(this, _AlembicWallet_eoaAdapter, "f"))
                throw new Error('No EOA adapter found');
            yield __classPrivateFieldGet(this, _AlembicWallet_eoaAdapter, "f").logout();
            __classPrivateFieldSet(this, _AlembicWallet_isConnected, false, "f");
        });
    }
    createMessage(address, nonce) {
        const domain = window.location.host;
        const origin = window.location.origin;
        const statement = `Sign in with Ethereum to Alembic`;
        const message = new siwe_1.SiweMessage({
            domain,
            address,
            statement,
            uri: origin,
            version: '1',
            chainId: __classPrivateFieldGet(this, _AlembicWallet_chainId, "f"),
            nonce: nonce === null || nonce === void 0 ? void 0 : nonce.connectionNonce
        });
        return message;
    }
}
exports.AlembicWallet = AlembicWallet;
_AlembicWallet_eoaAdapter = new WeakMap(), _AlembicWallet_chainId = new WeakMap(), _AlembicWallet_rpcTarget = new WeakMap(), _AlembicWallet_isConnected = new WeakMap();
