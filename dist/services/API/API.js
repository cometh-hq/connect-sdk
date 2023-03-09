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
exports.API = void 0;
const config_1 = require("../../config");
class API {
    static getNonce(account) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield config_1.api.get(`/wallets/connection-nonce/${account}`);
            const userNonce = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.userNonce;
            if (userNonce) {
                return userNonce;
            }
            return null;
        });
    }
    static connectToAlembicWallet({ message, signature, ownerAddress }) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = {
                message,
                signature,
                ownerAddress
            };
            const response = yield config_1.api.post(`/wallets/connect`, body);
            const data = response === null || response === void 0 ? void 0 : response.data;
            if (data === null || data === void 0 ? void 0 : data.walletAddress) {
                return data.walletAddress;
            }
            return null;
        });
    }
    static relayTransaction({ smartWalletAddress, safeTxData, signatures }) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            const body = Object.assign(Object.assign({}, safeTxData), { baseGas: (_a = safeTxData === null || safeTxData === void 0 ? void 0 : safeTxData.baseGas) === null || _a === void 0 ? void 0 : _a.toString(), gasPrice: (_b = safeTxData === null || safeTxData === void 0 ? void 0 : safeTxData.gasPrice) === null || _b === void 0 ? void 0 : _b.toString(), safeTxGas: (_c = safeTxData === null || safeTxData === void 0 ? void 0 : safeTxData.safeTxGas) === null || _c === void 0 ? void 0 : _c.toString(), signatures });
            const response = yield config_1.api.post(`/wallets/${smartWalletAddress}/relay`, body);
            if ((_d = response === null || response === void 0 ? void 0 : response.data) === null || _d === void 0 ? void 0 : _d.relayId) {
                return (_e = response === null || response === void 0 ? void 0 : response.data) === null || _e === void 0 ? void 0 : _e.relayId;
            }
            return null;
        });
    }
}
exports.API = API;
