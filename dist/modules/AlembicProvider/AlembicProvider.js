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
const API_1 = require("../../services/API/API");
class AlembicProvider {
    constructor({ ethProvider, smartWallet, apiKey }) {
        this.ethProvider = ethProvider;
        this.smartWallet = smartWallet;
        this.API = new API_1.API(apiKey);
    }
    request(request) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (request.method === 'eth_sendTransaction') {
                const _params = (request === null || request === void 0 ? void 0 : request.params) && Array.isArray(request === null || request === void 0 ? void 0 : request.params) && (request === null || request === void 0 ? void 0 : request.params[0])
                    ? request === null || request === void 0 ? void 0 : request.params[0]
                    : undefined;
                if (_params) {
                    const relayId = yield this.smartWallet.sendTransaction(_params);
                    if (!relayId)
                        throw new Error('eth_sendTransaction error');
                    return (_a = (yield this.API.getRelayTxStatus(relayId))) === null || _a === void 0 ? void 0 : _a.hash;
                }
                throw new Error('eth_sendTransaction error');
            }
            else if (request.method === 'eth_getTransactionReceipt') {
                console.log('eth_getTransactionReceipt', request.params);
                return yield this.ethProvider.send(request.method, (request.params || []));
            }
            else {
                return yield this.ethProvider.send(request.method, (request.params || []));
            }
        });
    }
}
exports.AlembicProvider = AlembicProvider;
