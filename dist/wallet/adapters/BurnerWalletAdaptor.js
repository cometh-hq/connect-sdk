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
class BurnerWalletAdaptor {
    constructor(chainId) {
        this.ethProvider = null;
        this.signer = undefined;
        this.wallet = null;
        this.chainId = chainId;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            const currentPrivateKey = window.localStorage.getItem('burner-private-key');
            if (currentPrivateKey) {
                this.wallet = new ethers_1.ethers.Wallet(currentPrivateKey);
            }
            else {
                this.wallet = ethers_1.ethers.Wallet.createRandom("'https://polygon-rpc.com'");
                window.localStorage.setItem('burner-private-key', this.wallet.privateKey);
            }
        });
    }
    connect() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.wallet) {
                this.ethProvider = new ethers_1.ethers.providers.Web3Provider(this.wallet.provider);
                this.signer = (_a = this.ethProvider) === null || _a === void 0 ? void 0 : _a.getSigner(this.wallet.address);
            }
        });
    }
    logout() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.signer)
                throw new Error('No Burner Wallet instance found');
            this.signer = undefined;
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
        var _a;
        return (_a = this.signer) !== null && _a !== void 0 ? _a : null;
    }
    getUserInfos() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.wallet)
                throw new Error('No Burner Wallet instance found');
            const walletAddress = yield this.wallet.address;
            return (_a = { walletAddress: walletAddress }) !== null && _a !== void 0 ? _a : {};
        });
    }
}
exports.BurnerWalletAdaptor = BurnerWalletAdaptor;
