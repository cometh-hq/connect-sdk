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
class RelayTransactionResponse {
    constructor(tx, provider) {
        this.provider = provider;
        this.hash = tx.hash;
        this.confirmations = tx.confirmations;
        this.from = tx.from;
        this.nonce = tx.nonce;
        this.gasLimit = tx.gasLimit;
        this.value = tx.value;
        this.data = tx.data;
        this.chainId = tx.chainId;
    }
    wait() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.provider.getTransactionReceipt(this.hash);
        });
    }
}
exports.RelayTransactionResponse = RelayTransactionResponse;
