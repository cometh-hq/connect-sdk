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
var _Web3AuthAdapter_web3auth, _Web3AuthAdapter_ethProvider;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3AuthAdapter = void 0;
const base_1 = require("@web3auth/base");
const modal_1 = require("@web3auth/modal");
const ethers_1 = require("ethers");
const constants_1 = require("../../constants");
class Web3AuthAdapter {
    constructor() {
        _Web3AuthAdapter_web3auth.set(this, null);
        _Web3AuthAdapter_ethProvider.set(this, null);
    }
    init(chainId, rpcTarget) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!chainId)
                throw new Error('Missing chainId parameter');
            if (!rpcTarget)
                throw new Error('Missing rpcUrl parameter');
            const web3auth = new modal_1.Web3Auth({
                clientId: constants_1.WEB3AUTH_CLIENT_ID,
                web3AuthNetwork: 'mainnet',
                chainConfig: {
                    chainId: ethers_1.ethers.utils.hexlify(chainId),
                    chainNamespace: base_1.CHAIN_NAMESPACES.EIP155,
                    rpcTarget
                }
            });
            if (!web3auth)
                throw new Error('No Web3Auth created');
            yield web3auth.initModal();
            __classPrivateFieldSet(this, _Web3AuthAdapter_web3auth, web3auth, "f");
        });
    }
    connect() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!__classPrivateFieldGet(this, _Web3AuthAdapter_web3auth, "f"))
                throw new Error('No Web3Auth instance found');
            yield __classPrivateFieldGet(this, _Web3AuthAdapter_web3auth, "f").connect();
            __classPrivateFieldSet(this, _Web3AuthAdapter_ethProvider, new ethers_1.ethers.providers.Web3Provider((_a = __classPrivateFieldGet(this, _Web3AuthAdapter_web3auth, "f")) === null || _a === void 0 ? void 0 : _a.provider), "f");
        });
    }
    logout() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!__classPrivateFieldGet(this, _Web3AuthAdapter_web3auth, "f"))
                throw new Error('No Web3Auth instance found');
            yield __classPrivateFieldGet(this, _Web3AuthAdapter_web3auth, "f").logout();
        });
    }
    getAccount() {
        return __awaiter(this, void 0, void 0, function* () {
            const signer = this.getSigner();
            if (!signer)
                throw new Error('No signer found');
            const account = (yield signer.getAddress());
            return account !== null && account !== void 0 ? account : null;
        });
    }
    getSigner() {
        if (!__classPrivateFieldGet(this, _Web3AuthAdapter_ethProvider, "f"))
            throw new Error('No Web3Auth provider found');
        const signer = __classPrivateFieldGet(this, _Web3AuthAdapter_ethProvider, "f").getSigner();
        return signer !== null && signer !== void 0 ? signer : null;
    }
}
exports.Web3AuthAdapter = Web3AuthAdapter;
_Web3AuthAdapter_web3auth = new WeakMap(), _Web3AuthAdapter_ethProvider = new WeakMap();
