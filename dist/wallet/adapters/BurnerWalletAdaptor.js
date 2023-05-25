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
exports.BurnerWalletAdaptor = void 0;
const ethers_1 = require("ethers");
const constants_1 = require("../../constants");
class BurnerWalletAdaptor {
    constructor(chainId, rpcUrl) {
        this.ethProvider = null;
        this.wallet = null;
        this.chainId = chainId;
        this.ethProvider = new ethers_1.ethers.providers.Web3Provider(rpcUrl ? rpcUrl : constants_1.networks[this.chainId].RPCUrl);
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.wallet = ethers_1.ethers.Wallet.createRandom();
        });
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            const wallet = ethers_1.ethers.Wallet.createRandom();
        });
    }
    logout() {
        return __awaiter(this, void 0, void 0, function* () {
            /*    if (!this.web3auth) throw new Error('No Web3Auth instance found')
            await this.web3auth.logout() */
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
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.wallet)
                throw new Error('No BurnerWallet instance found');
            const walletAddress = yield this.wallet.address;
            return (_a = { walletAddress: walletAddress }) !== null && _a !== void 0 ? _a : {};
        });
    }
}
exports.BurnerWalletAdaptor = BurnerWalletAdaptor;
