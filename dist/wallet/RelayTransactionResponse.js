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
exports.RelayTransactionResponse = void 0;
const ethers_1 = require("ethers");
class RelayTransactionResponse {
    constructor(safeTxHash, provider, alembicWallet) {
        this.safeTxHash = safeTxHash;
        this.provider = provider;
        this.alembicWallet = alembicWallet;
        this.hash = '0x0';
        this.confirmations = 0;
        this.from = this.alembicWallet.getAddress();
        this.nonce = 0;
        this.gasLimit = ethers_1.BigNumber.from(0);
        this.value = ethers_1.BigNumber.from(0);
        this.data = '0x0';
        this.chainId = 0;
    }
    getSafeTxHash() {
        return this.safeTxHash;
    }
    wait() {
        return __awaiter(this, void 0, void 0, function* () {
            let txSuccessEvent = undefined;
            let txFailureEvent = undefined;
            while (!txSuccessEvent && !txFailureEvent) {
                yield new Promise((resolve) => setTimeout(resolve, 2000));
                txSuccessEvent = yield this.alembicWallet.getSuccessExecTransactionEvent(this.safeTxHash);
                txFailureEvent = yield this.alembicWallet.getFailedExecTransactionEvent(this.safeTxHash);
            }
            if (txSuccessEvent) {
                let txResponse = null;
                while (txResponse === null) {
                    txResponse = yield this.provider.getTransactionReceipt(txSuccessEvent.transactionHash);
                    yield new Promise((resolve) => setTimeout(resolve, 1000));
                }
                this.hash = txResponse.transactionHash;
                this.confirmations = txResponse.confirmations;
                this.from = txResponse.from;
                this.data = txSuccessEvent.data;
                this.value = txSuccessEvent.args[1];
                return txResponse;
            }
            if (txFailureEvent) {
                let txResponse = null;
                while (txResponse === null) {
                    txResponse = yield this.provider.getTransactionReceipt(txFailureEvent.transactionHash);
                    yield new Promise((resolve) => setTimeout(resolve, 1000));
                }
                this.hash = txResponse.transactionHash;
                this.confirmations = txResponse.confirmations;
                this.from = txResponse.from;
                this.data = txFailureEvent.data;
                this.value = txFailureEvent.args[1];
                return txResponse;
            }
            yield new Promise((resolve) => setTimeout(resolve, 2000));
            return this.wait();
        });
    }
}
exports.RelayTransactionResponse = RelayTransactionResponse;
