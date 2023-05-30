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
exports.AlembicWallet = void 0;
const ethers_1 = require("ethers");
const siwe_1 = require("siwe");
const constants_1 = require("../constants");
const factories_1 = require("../contracts/types/factories");
const services_1 = require("../services");
const ui_1 = require("../ui");
const SafeUtils_1 = __importDefault(require("./SafeUtils"));
const WebAuthnUtils_1 = __importDefault(require("./WebAuthnUtils"));
class AlembicWallet {
    constructor({ authAdapter, apiKey, rpcUrl }) {
        this.connected = false;
        this.uiConfig = {
            displayValidationModal: true
        };
        // Contracts Interfaces
        this.SafeInterface = factories_1.Safe__factory.createInterface();
        this.P256FactoryInterface = factories_1.P256SignerFactory__factory.createInterface();
        this._getBalance = (address) => __awaiter(this, void 0, void 0, function* () {
            return this.getProvider().getBalance(address);
        });
        this._signTransactionWithEOA = (safeTxData) => __awaiter(this, void 0, void 0, function* () {
            const signer = this.authAdapter.getSigner();
            if (!signer)
                throw new Error('Sign message: missing signer');
            return yield signer._signTypedData({
                chainId: this.chainId,
                verifyingContract: this.getAddress()
            }, constants_1.EIP712_SAFE_TX_TYPES, {
                to: safeTxData.to,
                value: ethers_1.BigNumber.from(safeTxData.value).toString(),
                data: safeTxData.data,
                operation: 0,
                safeTxGas: ethers_1.BigNumber.from(safeTxData.safeTxGas).toString(),
                baseGas: ethers_1.BigNumber.from(safeTxData.baseGas).toString(),
                gasPrice: ethers_1.BigNumber.from(safeTxData.gasPrice).toString(),
                gasToken: ethers_1.ethers.constants.AddressZero,
                refundReceiver: ethers_1.ethers.constants.AddressZero,
                nonce: ethers_1.BigNumber.from(yield SafeUtils_1.default.getNonce(this.getAddress(), this.getProvider())).toString()
            });
        });
        this.authAdapter = authAdapter;
        this.chainId = +authAdapter.chainId;
        this.API = new services_1.API(apiKey, this.chainId);
        this.provider = new ethers_1.ethers.providers.StaticJsonRpcProvider(rpcUrl ? rpcUrl : constants_1.networks[this.chainId].RPCUrl);
        this.BASE_GAS = constants_1.DEFAULT_BASE_GAS;
        this.REWARD_PERCENTILE = constants_1.DEFAULT_REWARD_PERCENTILE;
    }
    /**
     * Connection Section
     */
    connect() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this._verifyWebAuthnOwner())) {
                if (!this.authAdapter)
                    throw new Error('No EOA adapter found');
                if (!constants_1.networks[this.chainId])
                    throw new Error('This network is not supported');
                yield this.authAdapter.connect();
                const signer = this.authAdapter.getSigner();
                if (!signer)
                    throw new Error('No signer found');
                const ownerAddress = yield signer.getAddress();
                if (!ownerAddress)
                    throw new Error('No ownerAddress found');
                const nonce = yield this.API.getNonce(ownerAddress);
                const message = this._createMessage(ownerAddress, nonce);
                const messageToSign = message.prepareMessage();
                const signature = yield signer.signMessage(messageToSign);
                this.walletAddress = yield ((_a = this.API) === null || _a === void 0 ? void 0 : _a.connectToAlembicWallet({
                    message,
                    signature,
                    ownerAddress
                }));
            }
            else {
                const currentWebAuthnOwner = yield this.getCurrentWebAuthnOwner();
                if (currentWebAuthnOwner)
                    this.walletAddress = currentWebAuthnOwner.walletAddress;
            }
            this.sponsoredAddresses = yield this.API.getSponsoredAddresses();
            this.connected = true;
        });
    }
    getConnected() {
        return this.connected;
    }
    getProvider() {
        return this.provider;
    }
    getUserInfos() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userInfos = yield this.authAdapter.getUserInfos();
                return Object.assign(Object.assign({}, userInfos), { ownerAddress: yield ((_a = this.authAdapter.getSigner()) === null || _a === void 0 ? void 0 : _a.getAddress()), walletAddress: this.getAddress() });
            }
            catch (_b) {
                return { walletAddress: this.getAddress() };
            }
        });
    }
    getAddress() {
        var _a;
        return (_a = this.walletAddress) !== null && _a !== void 0 ? _a : '';
    }
    _createMessage(address, nonce) {
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
    logout() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.authAdapter)
                yield this.authAdapter.logout();
            this.connected = false;
        });
    }
    addOwner(newOwner) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = {
                to: this.getAddress(),
                value: '0x0',
                data: this.SafeInterface.encodeFunctionData('addOwnerWithThreshold', [
                    newOwner,
                    1
                ])
            };
            return yield this.sendTransaction(tx);
        });
    }
    /**
     * Signing Message Section
     */
    signMessage(messageToSign) {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield this._verifyWebAuthnOwner()) {
                return this._signMessageWithWebAuthn(messageToSign);
            }
            else {
                return this._signMessageWithEOA(messageToSign);
            }
        });
    }
    _signMessageWithEOA(messageToSign) {
        return __awaiter(this, void 0, void 0, function* () {
            const signer = this.authAdapter.getSigner();
            if (!signer)
                throw new Error('Sign message: missing signer');
            return yield signer._signTypedData({
                chainId: this.chainId,
                verifyingContract: this.getAddress()
            }, constants_1.EIP712_SAFE_MESSAGE_TYPE, { message: messageToSign });
        });
    }
    /**
     * Transaction Section
     */
    signTransaction(safeTxData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield this._verifyWebAuthnOwner()) {
                return this._signTransactionwithWebAuthn(safeTxData);
            }
            else {
                return this._signTransactionWithEOA(safeTxData);
            }
        });
    }
    _isSponsoredAddress(targetAddress) {
        var _a;
        const sponsoredAddress = (_a = this.sponsoredAddresses) === null || _a === void 0 ? void 0 : _a.find((sponsoredAddress) => sponsoredAddress.targetAddress === targetAddress);
        return sponsoredAddress ? true : false;
    }
    _estimateTransactionGas(safeTxData) {
        return __awaiter(this, void 0, void 0, function* () {
            const safeTxGas = yield this.getProvider().estimateGas({
                from: this.getAddress(),
                to: safeTxData.to,
                value: safeTxData.value,
                data: safeTxData.data
            });
            const ethFeeHistory = yield this.getProvider().send('eth_feeHistory', [
                1,
                'latest',
                [this.REWARD_PERCENTILE]
            ]);
            const [reward, BaseFee] = [
                ethers_1.BigNumber.from(ethFeeHistory.reward[0][0]),
                ethers_1.BigNumber.from(ethFeeHistory.baseFeePerGas[0])
            ];
            const gasPrice = ethers_1.BigNumber.from(reward.add(BaseFee)).add(ethers_1.BigNumber.from(reward.add(BaseFee)).div(10));
            return {
                safeTxGas,
                baseGas: this.BASE_GAS,
                gasPrice: gasPrice
            };
        });
    }
    _calculateAndShowMaxFee(txValue, safeTxGas, baseGas, gasPrice) {
        return __awaiter(this, void 0, void 0, function* () {
            const walletBalance = yield this._getBalance(this.getAddress());
            const totalGasCost = ethers_1.BigNumber.from(safeTxGas)
                .add(ethers_1.BigNumber.from(baseGas))
                .mul(ethers_1.BigNumber.from(gasPrice));
            if (walletBalance.lt(totalGasCost.add(ethers_1.BigNumber.from(txValue))))
                throw new Error('Not enough balance to send this value and pay for gas');
            if (this.uiConfig.displayValidationModal) {
                const totalFees = ethers_1.ethers.utils.formatEther(ethers_1.ethers.utils.parseUnits(ethers_1.BigNumber.from(safeTxGas).add(baseGas).mul(gasPrice).toString(), 'wei'));
                if (!(yield new ui_1.GasModal().initModal((+totalFees).toFixed(3)))) {
                    throw new Error('Transaction denied');
                }
            }
        });
    }
    sendTransaction(safeTxData) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const safeTxDataTyped = {
                to: safeTxData.to,
                value: (_a = safeTxData.value) !== null && _a !== void 0 ? _a : '0x0',
                data: safeTxData.data,
                operation: 0,
                safeTxGas: 0,
                baseGas: 0,
                gasPrice: 0,
                gasToken: ethers_1.ethers.constants.AddressZero,
                refundReceiver: ethers_1.ethers.constants.AddressZero,
                nonce: yield SafeUtils_1.default.getNonce(this.getAddress(), this.getProvider())
            };
            const { safeTxGas, baseGas, gasPrice } = yield this._estimateTransactionGas(safeTxDataTyped);
            if (!this._isSponsoredAddress(safeTxDataTyped.to)) {
                safeTxDataTyped.safeTxGas = +safeTxGas; // gwei
                safeTxDataTyped.baseGas = baseGas; // gwei
                safeTxDataTyped.gasPrice = +gasPrice; // wei
                yield this._calculateAndShowMaxFee(safeTxDataTyped.value, safeTxGas, baseGas, gasPrice);
            }
            const txSignature = yield this.signTransaction(safeTxDataTyped);
            const safeTxHash = yield this.API.relayTransaction({
                safeTxData: safeTxDataTyped,
                signatures: txSignature,
                walletAddress: this.getAddress()
            });
            return { safeTxHash };
        });
    }
    /**
     * WebAuthn Section
     */
    getCurrentWebAuthnOwner() {
        return __awaiter(this, void 0, void 0, function* () {
            const publicKeyId = WebAuthnUtils_1.default.getCurrentPublicKeyId();
            if (publicKeyId === null)
                return undefined;
            const currentWebAuthnOwner = yield this.API.getWebAuthnOwnerByPublicKeyId(publicKeyId);
            if (currentWebAuthnOwner === null)
                return undefined;
            this.walletAddress = currentWebAuthnOwner.walletAddress;
            return currentWebAuthnOwner;
        });
    }
    addWebAuthnOwner() {
        return __awaiter(this, void 0, void 0, function* () {
            const isDeployed = yield SafeUtils_1.default.isDeployed(this.getAddress(), this.getProvider());
            if (!isDeployed)
                throw new Error('You need to make a transaction before deploying a webAuth signer');
            const getWebAuthnOwners = yield this.API.getWebAuthnOwners(this.getAddress());
            const signerName = `Alembic Connect - ${getWebAuthnOwners ? getWebAuthnOwners.length + 1 : 1}`;
            const webAuthnCredentials = yield WebAuthnUtils_1.default.createCredentials(signerName);
            const publicKeyX = `0x${webAuthnCredentials.point.getX().toString(16)}`;
            const publicKeyY = `0x${webAuthnCredentials.point.getY().toString(16)}`;
            const publicKeyId = webAuthnCredentials.id;
            const predictedSignerAddress = yield WebAuthnUtils_1.default.predictSignerAddress(publicKeyX, publicKeyY, this.chainId);
            const addOwnerTxData = {
                to: this.getAddress(),
                value: '0x00',
                data: this.SafeInterface.encodeFunctionData('addOwnerWithThreshold', [
                    predictedSignerAddress,
                    1
                ]),
                operation: 0,
                safeTxGas: 0,
                baseGas: 0,
                gasPrice: 0,
                gasToken: ethers_1.ethers.constants.AddressZero,
                refundReceiver: ethers_1.ethers.constants.AddressZero
            };
            const addOwnerTxSignature = yield this.signTransaction(addOwnerTxData);
            const message = `${publicKeyX},${publicKeyY},${publicKeyId}`;
            const signature = yield this.signMessage(ethers_1.ethers.utils.hashMessage(message));
            yield this.API.addWebAuthnOwner(this.getAddress(), signerName, publicKeyId, publicKeyX, publicKeyY, signature, message, JSON.stringify(addOwnerTxData), addOwnerTxSignature);
            yield WebAuthnUtils_1.default.waitWebAuthnSignerDeployment(publicKeyX, publicKeyY, this.chainId, this.getProvider());
            WebAuthnUtils_1.default.updateCurrentWebAuthnOwner(publicKeyId, publicKeyX, publicKeyY);
            return predictedSignerAddress;
        });
    }
    _verifyWebAuthnOwner() {
        return __awaiter(this, void 0, void 0, function* () {
            const currentWebAuthnOwner = yield this.getCurrentWebAuthnOwner();
            if (!currentWebAuthnOwner)
                return false;
            const safeInstance = yield factories_1.Safe__factory.connect(currentWebAuthnOwner.walletAddress, this.getProvider());
            const isSafeOwner = yield safeInstance.isOwner(currentWebAuthnOwner.signerAddress);
            if (!isSafeOwner)
                return false;
            return true;
        });
    }
    _signTransactionwithWebAuthn(safeTxDataTyped) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentWebAuthnOwner = yield this.getCurrentWebAuthnOwner();
            if (!currentWebAuthnOwner)
                throw new Error('No WebAuthn signer found');
            const safeTxHash = yield SafeUtils_1.default.getSafeTransactionHash(this.getAddress(), {
                to: safeTxDataTyped.to,
                value: ethers_1.BigNumber.from(safeTxDataTyped.value).toString(),
                data: safeTxDataTyped.data,
                operation: ethers_1.BigNumber.from(safeTxDataTyped.operation).toString(),
                safeTxGas: ethers_1.BigNumber.from(safeTxDataTyped.safeTxGas).toString(),
                baseGas: ethers_1.BigNumber.from(safeTxDataTyped.baseGas).toString(),
                gasPrice: ethers_1.BigNumber.from(safeTxDataTyped.gasPrice).toString(),
                gasToken: ethers_1.ethers.constants.AddressZero,
                refundReceiver: ethers_1.ethers.constants.AddressZero,
                nonce: ethers_1.BigNumber.from(yield SafeUtils_1.default.getNonce(this.getAddress(), this.getProvider())).toString()
            }, this.chainId);
            const encodedWebAuthnSignature = yield WebAuthnUtils_1.default.getWebAuthnSignature(safeTxHash, currentWebAuthnOwner.publicKeyId);
            return SafeUtils_1.default.formatWebAuthnSignatureForSafe(currentWebAuthnOwner.signerAddress, encodedWebAuthnSignature);
        });
    }
    _signMessageWithWebAuthn(messageToSign) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentWebAuthnOwner = yield this.getCurrentWebAuthnOwner();
            if (!currentWebAuthnOwner)
                throw new Error('No WebAuthn signer found');
            const encodedWebAuthnSignature = yield WebAuthnUtils_1.default.getWebAuthnSignature(ethers_1.ethers.utils.keccak256(messageToSign), currentWebAuthnOwner.publicKeyId);
            return SafeUtils_1.default.formatWebAuthnSignatureForSafe(currentWebAuthnOwner.signerAddress, encodedWebAuthnSignature);
        });
    }
}
exports.AlembicWallet = AlembicWallet;
