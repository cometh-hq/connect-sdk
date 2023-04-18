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
exports.AlembicSigner = void 0;
const abstract_signer_1 = require("@ethersproject/abstract-signer");
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
class AlembicSigner extends abstract_signer_1.Signer {
    constructor(smartWallet, albProvider) {
        super();
        this.smartWallet = smartWallet;
        (0, utils_1.defineReadOnly)(this, 'provider', albProvider);
    }
    getAddress() {
        return Promise.resolve(this.smartWallet.getSmartWalletAddress());
    }
    signMessage(message) {
        return this.smartWallet.signMessage(message);
    }
    sendTransaction(transaction) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            const tx = yield (0, utils_1.resolveProperties)(this.checkTransaction(transaction));
            const safeTx = {
                to: (_a = tx.to) !== null && _a !== void 0 ? _a : '',
                value: ethers_1.BigNumber.from((_b = tx.value) !== null && _b !== void 0 ? _b : '0').toHexString(),
                data: (_d = (_c = tx.data) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : '0x'
            };
            const transactionResponse = yield this.smartWallet.sendTransaction(safeTx);
            if (!this.provider)
                throw new Error('missing provider');
            const txReturn = yield this.provider.getTransaction(transactionResponse.relayId);
            return txReturn;
        });
    }
    signTransaction(transaction) {
        throw new Error('Method not implemented.');
    }
    connect(provider) {
        throw new Error('changing providers is not supported');
    }
}
exports.AlembicSigner = AlembicSigner;
