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
const types_1 = require("./types");
class RelayTransactionResponse {
    constructor(tx, relayID, provider) {
        this.relayID = relayID;
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
    wait(confirmations) {
        return __awaiter(this, void 0, void 0, function* () {
            const status = yield this.provider.getRelayStatus(this.relayID);
            if (status.status == types_1.RelayStatus.MINED) {
                return this.provider.getTransactionReceipt(status.hash);
            }
            yield new Promise((resolve) => setTimeout(resolve, 2000));
            return this.wait(confirmations);
        });
    }
}
exports.RelayTransactionResponse = RelayTransactionResponse;
