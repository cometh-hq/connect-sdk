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
exports.MagicLinkAdapter = void 0;
const ethers_1 = require("ethers");
const magic_sdk_1 = require("magic-sdk");
class MagicLinkAdapter {
    constructor(magicConfig) {
        this.magic = null;
        this.ethProvider = null;
        this.magicConfig = magicConfig;
        this.chainId = magicConfig.options.chainId;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.magicConfig)
                throw new Error('Missing config for magicLink');
            const { apiKey, options } = this.magicConfig;
            this.magic = new magic_sdk_1.Magic(apiKey, options);
            if (!this.magic)
                throw new Error('No Magic instance found');
            yield this.magic.wallet.connectWithUI();
            const provider = yield this.magic.wallet.getProvider();
            this.ethProvider = new ethers_1.ethers.providers.Web3Provider(provider);
        });
    }
    logout() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.magic)
                throw new Error('No magicLink instance found');
            yield this.magic.user.logout();
        });
    }
    getAccount() {
        return __awaiter(this, void 0, void 0, function* () {
            const signer = this.getSigner();
            if (!signer)
                throw new Error('No signer found');
            return yield signer.getAddress();
        });
    }
    getSigner() {
        if (!this.ethProvider)
            throw new Error('No Web3Auth provider found');
        return this.ethProvider.getSigner();
    }
    getUserInfos() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.magic)
                throw new Error('No magicLink instance found');
            const userInfos = yield this.magic.user.getInfo();
            return userInfos !== null && userInfos !== void 0 ? userInfos : {};
        });
    }
}
exports.MagicLinkAdapter = MagicLinkAdapter;
