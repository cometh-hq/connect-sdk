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
exports.AlembicWallet = void 0;
const siwe_1 = require("siwe");
const adapters_1 = require("../../adapters");
const API_1 = require("../API/API");
class AlembicWallet {
    constructor(eoaAdapter = adapters_1.Web3AuthAdapter, chainId = adapters_1.DEFAULT_CHAIN_ID, rpcTarget = adapters_1.DEFAULT_RPC_TARGET) {
        this.isConnected = false;
        this.chainId = chainId;
        this.rpcTarget = rpcTarget;
        this.eoaAdapter = new eoaAdapter();
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            // Return if does not match requirements
            if (!this.eoaAdapter)
                throw new Error('No EOA adapter found');
            if (!this.chainId)
                throw new Error('No chainId set');
            if (!this.rpcTarget)
                throw new Error('No rpcUrl set');
            // Initialize EOA adapter
            yield this.eoaAdapter.init(this.chainId, this.rpcTarget);
            yield this.eoaAdapter.connect();
            // We get the user account
            const account = yield this.eoaAdapter.getAccount();
            if (!account)
                throw new Error('No account found');
            // We get the user nonce by calling AlembicAPI
            const nonce = yield API_1.API.getNonce(account);
            if (!nonce)
                throw new Error('No nonce found');
            // We prepare and sign a message, using siwe, in order to prove the user identity
            const message = this.createMessage(account, nonce);
            const messageToSign = message.prepareMessage();
            const signer = this.eoaAdapter.getSigner();
            if (!signer)
                throw new Error('No signer found');
            const signature = yield signer.signMessage(messageToSign);
            if (!signature)
                throw new Error('No signature found');
            const walletAddress = yield API_1.API.connectToAlembicWallet({
                message,
                signature,
                ownerAddress: account
            });
            if (!walletAddress)
                throw new Error('Failed to connect to Alembic');
            if (walletAddress) {
                this.isConnected = true;
            }
        });
    }
    getIsConnected() {
        return this.isConnected;
    }
    logout() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.eoaAdapter)
                throw new Error('No EOA adapter found');
            yield this.eoaAdapter.logout();
            this.isConnected = false;
        });
    }
    createMessage(address, nonce) {
        const domain = window.location.host;
        const origin = window.location.origin;
        const statement = `Sign in with Ethereum to Alembic`;
        const message = new siwe_1.SiweMessage({
            domain,
            address,
            statement,
            uri: origin,
            version: '1',
            chainId: this.chainId,
            nonce: nonce === null || nonce === void 0 ? void 0 : nonce.connectionNonce
        });
        return message;
    }
}
exports.AlembicWallet = AlembicWallet;
