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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.API = exports.api = void 0;
const axios_1 = __importDefault(require("axios"));
const constants_1 = require("../constants");
exports.api = axios_1.default.create({
    baseURL: constants_1.API_URL
});
class API {
    constructor(apiKey) {
        exports.api.defaults.headers.common['apikey'] = apiKey;
    }
    getNonce(account) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield exports.api.get(`/wallets/connection-nonce/${account}`);
            return (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.userNonce;
        });
    }
    getSponsoredAddresses() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield exports.api.get(`/sponsored-address`);
            return response === null || response === void 0 ? void 0 : response.data;
        });
    }
    connectToAlembicWallet({ message, signature, ownerAddress }) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = {
                message,
                signature,
                ownerAddress
            };
            const response = yield exports.api.post(`/wallets/connect`, body);
            const data = response === null || response === void 0 ? void 0 : response.data;
            return data.walletAddress;
        });
    }
    relayTransaction({ smartWalletAddress, safeTxData, signatures }) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            const body = Object.assign(Object.assign({}, safeTxData), { baseGas: (_a = safeTxData === null || safeTxData === void 0 ? void 0 : safeTxData.baseGas) === null || _a === void 0 ? void 0 : _a.toString(), gasPrice: (_b = safeTxData === null || safeTxData === void 0 ? void 0 : safeTxData.gasPrice) === null || _b === void 0 ? void 0 : _b.toString(), safeTxGas: (_c = safeTxData === null || safeTxData === void 0 ? void 0 : safeTxData.safeTxGas) === null || _c === void 0 ? void 0 : _c.toString(), signatures });
            const response = yield exports.api.post(`/wallets/${smartWalletAddress}/relay`, body);
            return (_d = response.data) === null || _d === void 0 ? void 0 : _d.relayId;
        });
    }
    getRelayTxStatus(relayId) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield exports.api.get(`/wallets/relay/${relayId}`);
            return response.data;
        });
    }
}
exports.API = API;
