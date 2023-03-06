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
exports.API = void 0;
const axios_1 = __importDefault(require("axios"));
const constants_1 = require("../../constants");
class API {
    static getNonce(account) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${constants_1.API_URL}/wallets/connection-nonce/${account}`;
            const response = yield axios_1.default.get(url);
            const userNonce = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.userNonce;
            if (userNonce) {
                return userNonce;
            }
            return null;
        });
    }
    static connectToAlembicWallet({ message, signature, ownerAddress }) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${constants_1.API_URL}/wallets/connect`;
            const body = {
                message,
                signature,
                ownerAddress
            };
            const response = yield axios_1.default.post(url, body);
            const data = response === null || response === void 0 ? void 0 : response.data;
            if (data) {
                return data;
            }
            return null;
        });
    }
}
exports.API = API;
