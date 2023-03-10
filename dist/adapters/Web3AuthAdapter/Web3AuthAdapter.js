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
exports.Web3AuthAdapter = void 0;
const base_1 = require("@web3auth/base");
const modal_1 = require("@web3auth/modal");
const ethers_1 = require("ethers");
const constants_1 = require("../../constants");
class Web3AuthAdapter {
    constructor() {
        this.web3auth = null;
        this.ethProvider = null;
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
            this.web3auth = web3auth;
        });
    }
    connect() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.web3auth)
                throw new Error('No Web3Auth instance found');
            yield this.web3auth.connect();
            this.ethProvider = new ethers_1.ethers.providers.Web3Provider((_a = this.web3auth) === null || _a === void 0 ? void 0 : _a.provider);
        });
    }
    logout() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.web3auth)
                throw new Error('No Web3Auth instance found');
            yield this.web3auth.logout();
        });
    }
    getAccount() {
        return __awaiter(this, void 0, void 0, function* () {
            const signer = this.getSigner();
            if (!signer)
                throw new Error('No signer found');
            const account = yield signer.getAddress();
            return account !== null && account !== void 0 ? account : null;
        });
    }
    getSigner() {
        if (!this.ethProvider)
            throw new Error('No Web3Auth provider found');
        const signer = this.ethProvider.getSigner();
        return signer !== null && signer !== void 0 ? signer : null;
    }
    getEthProvider() {
        var _a;
        return (_a = this.ethProvider) !== null && _a !== void 0 ? _a : null;
    }
    getUserInfos() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.web3auth)
                throw new Error('No Web3Auth instance found');
            const userInfos = yield this.web3auth.getUserInfo();
            return userInfos !== null && userInfos !== void 0 ? userInfos : {};
        });
    }
}
exports.Web3AuthAdapter = Web3AuthAdapter;
