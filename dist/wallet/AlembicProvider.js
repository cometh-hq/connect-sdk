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
exports.AlembicProvider = void 0;
const providers_1 = require("@ethersproject/providers");
const constants_1 = require("../constants");
const AlembicSigner_1 = require("./AlembicSigner");
const RelayTransactionResponse_1 = require("./RelayTransactionResponse");
class AlembicProvider extends providers_1.BaseProvider {
    constructor(alembicWallet) {
        var _a;
        super({
            name: 'ERC-4337 Custom Network',
            chainId: (_a = alembicWallet.chainId) !== null && _a !== void 0 ? _a : constants_1.DEFAULT_CHAIN_ID
        });
        this.alembicWallet = alembicWallet;
        this.signer = new AlembicSigner_1.AlembicSigner(alembicWallet, this);
    }
    getSigner() {
        return this.signer;
    }
    perform(method, params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (method === 'sendTransaction') {
                throw new Error('Not authorized method: sendTransaction');
            }
            return yield this.alembicWallet.getOwnerProvider().perform(method, params);
        });
    }
    send(method, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.alembicWallet.getOwnerProvider().send(method, params);
        });
    }
    getTransaction(transactionHash) {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise((resolve) => setTimeout(resolve, 5000));
            const txResponse = yield this.getRelayStatus(transactionHash);
            return new RelayTransactionResponse_1.RelayTransactionResponse(txResponse.transaction, transactionHash, this);
        });
    }
    getRelayStatus(transactionHash) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.alembicWallet.getRelayTxStatus(transactionHash);
        });
    }
    getTransactionReceipt(transactionHash) {
        const _super = Object.create(null, {
            getTransactionReceipt: { get: () => super.getTransactionReceipt }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return _super.getTransactionReceipt.call(this, transactionHash);
        });
    }
    waitForTransaction(transactionHash, confirmations, timeout) {
        const _super = Object.create(null, {
            waitForTransaction: { get: () => super.waitForTransaction }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return _super.waitForTransaction.call(this, transactionHash, confirmations, timeout);
        });
    }
    detectNetwork() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.alembicWallet.getOwnerProvider().detectNetwork();
        });
    }
}
exports.AlembicProvider = AlembicProvider;
