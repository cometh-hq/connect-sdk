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
exports.SmartWallet = void 0;
const safe_core_sdk_1 = __importDefault(require("@safe-global/safe-core-sdk"));
const safe_ethers_lib_1 = __importDefault(require("@safe-global/safe-ethers-lib"));
const ethers_1 = require("ethers");
const API_1 = require("../../services/API/API");
class SmartWallet {
    constructor({ smartWalletAddress, ethProvider }) {
        this.safeSdk = null;
        this.smartWalletAddress = smartWalletAddress;
        this.ethProvider = ethProvider;
        this.ethAdapter = new safe_ethers_lib_1.default({
            ethers: ethers_1.ethers,
            signerOrProvider: this.ethProvider.getSigner()
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.ethAdapter)
                throw new Error('No EOA adapter found');
            if (!this.ethProvider)
                throw new Error('No ethProvider set');
            if (!this.smartWalletAddress)
                throw new Error('No smartWalletAddress set');
            const safeSdk = yield safe_core_sdk_1.default.create({
                ethAdapter: this.ethAdapter,
                safeAddress: this.smartWalletAddress
            });
            if (safeSdk) {
                this.safeSdk = safeSdk;
            }
        });
    }
    sendTransaction(safeTxData) {
        var _a, _b, _c, _d, _e, _f;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.safeSdk)
                throw new Error('No Safe SDK found');
            const safeTxDataTyped = {
                to: safeTxData.to,
                value: safeTxData.value,
                data: safeTxData.data,
                operation: (_a = safeTxData.operation) !== null && _a !== void 0 ? _a : 0,
                safeTxGas: (_b = safeTxData.safeTxGas) !== null && _b !== void 0 ? _b : 0,
                baseGas: (_c = safeTxData.baseGas) !== null && _c !== void 0 ? _c : 0,
                gasPrice: (_d = safeTxData.gasPrice) !== null && _d !== void 0 ? _d : 0,
                gasToken: (_e = safeTxData.gasToken) !== null && _e !== void 0 ? _e : ethers_1.ethers.constants.AddressZero,
                refundReceiver: (_f = safeTxData.refundReceiver) !== null && _f !== void 0 ? _f : ethers_1.ethers.constants.AddressZero
            };
            const safeTransaction = yield this.safeSdk.createTransaction({
                safeTransactionData: safeTxDataTyped
            });
            const signature = yield this.safeSdk.signTypedData(safeTransaction);
            const relayId = yield API_1.API.relayTransaction({
                safeTxData: safeTxDataTyped,
                signatures: signature.data,
                smartWalletAddress: this.smartWalletAddress
            });
            return relayId;
        });
    }
}
exports.SmartWallet = SmartWallet;
