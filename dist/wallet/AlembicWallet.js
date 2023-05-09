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
const WebAuthn_1 = __importDefault(require("./WebAuthn"));
class AlembicWallet {
    constructor({ authAdapter, apiKey }) {
        this.connected = false;
        // Contract Interfaces
        this.SafeInterface = factories_1.Safe__factory.createInterface();
        this.P256FactoryContract = factories_1.P256SignerFactory__factory.createInterface();
        /**
         * Transaction Section
         */
        this._signTransaction = (safeTxData, nonce) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const signer = (_a = this.authAdapter.getEthProvider()) === null || _a === void 0 ? void 0 : _a.getSigner();
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
                nonce: ethers_1.BigNumber.from(nonce !== null && nonce !== void 0 ? nonce : (yield this._getNonce())).toString()
            });
        });
        this._getNonce = () => __awaiter(this, void 0, void 0, function* () {
            return (yield this.isDeployed())
                ? (yield factories_1.Safe__factory.connect(this.getAddress(), this.getOwnerProvider()).nonce()).toNumber()
                : 0;
        });
        this.authAdapter = authAdapter;
        this.chainId = +authAdapter.chaindId;
        this.API = new services_1.API(apiKey, this.chainId);
        this.BASE_GAS = constants_1.DEFAULT_BASE_GAS;
        this.REWARD_PERCENTILE = constants_1.DEFAULT_REWARD_PERCENTILE;
    }
    /**
     * Connection Section
     */
    connect() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            // Return if does not match requirements
            if (!this.authAdapter)
                throw new Error('No EOA adapter found');
            if (!constants_1.networks[this.chainId])
                throw new Error('This network is not supported');
            yield this.authAdapter.init();
            yield this.authAdapter.connect();
            const signer = (_a = this.authAdapter.getEthProvider()) === null || _a === void 0 ? void 0 : _a.getSigner();
            if (!signer)
                throw new Error('No signer found');
            const ownerAddress = yield signer.getAddress();
            if (!ownerAddress)
                throw new Error('No ownerAddress found');
            const nonce = yield this.API.getNonce(ownerAddress);
            const message = this._createMessage(ownerAddress, nonce);
            const messageToSign = message.prepareMessage();
            const signature = yield signer.signMessage(messageToSign);
            const walletAddress = yield ((_b = this.API) === null || _b === void 0 ? void 0 : _b.connectToAlembicWallet({
                message,
                signature,
                ownerAddress
            }));
            this.sponsoredAddresses = yield this.API.getSponsoredAddresses();
            this.webAuthnOwners = yield this.API.getWebAuthnOwners(walletAddress);
            this.connected = true;
            this.walletAddress = walletAddress;
        });
    }
    getConnected() {
        return this.connected;
    }
    isDeployed() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield factories_1.Safe__factory.connect(this.getAddress(), this.getOwnerProvider()).deployed();
                return true;
            }
            catch (error) {
                return false;
            }
        });
    }
    getUserInfos() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.authAdapter)
                throw new Error('Cannot provide user infos');
            const userInfos = yield this.authAdapter.getUserInfos();
            return Object.assign(Object.assign({}, userInfos), { ownerAddress: yield ((_a = this.authAdapter.getSigner()) === null || _a === void 0 ? void 0 : _a.getAddress()), walletAddress: this.getAddress() });
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
            if (!this.authAdapter)
                throw new Error('No EOA adapter found');
            yield this.authAdapter.logout();
            this.connected = false;
        });
    }
    addOwner(newOwner) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log({ newOwner });
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
    getOwnerProvider() {
        const provider = this.authAdapter.getEthProvider();
        if (!provider)
            throw new Error('getOwnerProvider: missing provider');
        return provider;
    }
    signMessage(messageToSign) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const signer = (_a = this.authAdapter.getEthProvider()) === null || _a === void 0 ? void 0 : _a.getSigner();
            if (!signer)
                throw new Error('Sign message: missing signer');
            const messageHash = ethers_1.ethers.utils.hashMessage(messageToSign);
            const signature = yield signer._signTypedData({
                verifyingContract: this.getAddress(),
                chainId: this.chainId
            }, constants_1.EIP712_SAFE_MESSAGE_TYPE, { message: messageHash });
            return signature;
        });
    }
    _toSponsoredAddress(targetAddress) {
        var _a;
        const sponsoredAddress = (_a = this.sponsoredAddresses) === null || _a === void 0 ? void 0 : _a.find((sponsoredAddress) => sponsoredAddress.targetAddress === targetAddress);
        return sponsoredAddress ? true : false;
    }
    _estimateTransactionGas(safeTxData) {
        return __awaiter(this, void 0, void 0, function* () {
            const safeTxGas = yield this.getOwnerProvider().estimateGas({
                from: this.getAddress(),
                to: safeTxData.to,
                value: safeTxData.value,
                data: safeTxData.data
            });
            const ethFeeHistory = yield this.getOwnerProvider().send('eth_feeHistory', [
                1,
                'latest',
                [this.REWARD_PERCENTILE]
            ]);
            const [reward, BaseFee] = [
                ethers_1.BigNumber.from(ethFeeHistory.reward[0][0]),
                ethers_1.BigNumber.from(ethFeeHistory.baseFeePerGas[0])
            ];
            return {
                safeTxGas,
                baseGas: this.BASE_GAS,
                gasPrice: reward.add(BaseFee)
            };
        });
    }
    sendTransaction(safeTxData) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const nonce = yield this._getNonce();
            const safeTxDataTyped = {
                to: safeTxData.to,
                value: (_a = safeTxData.value) !== null && _a !== void 0 ? _a : 0,
                data: safeTxData.data,
                operation: 0,
                safeTxGas: 0,
                baseGas: 0,
                gasPrice: 0,
                gasToken: ethers_1.ethers.constants.AddressZero,
                refundReceiver: ethers_1.ethers.constants.AddressZero,
                nonce
            };
            if (!this._toSponsoredAddress(safeTxDataTyped.to)) {
                const { safeTxGas, baseGas, gasPrice } = yield this._estimateTransactionGas(safeTxDataTyped);
                safeTxDataTyped.safeTxGas = +safeTxGas;
                safeTxDataTyped.baseGas = baseGas;
                safeTxDataTyped.gasPrice = +gasPrice;
            }
            let signature;
            if (this.webAuthnOwners && this.webAuthnOwners.length > 0) {
                this._verifyWebAuthnOwner();
                signature = yield this._signTransactionwithWebAuthn(safeTxDataTyped);
            }
            else {
                signature = yield this._signTransaction(safeTxDataTyped, nonce);
            }
            const safeTxHash = yield this.API.relayTransaction({
                safeTxData: safeTxDataTyped,
                signatures: signature,
                walletAddress: this.getAddress()
            });
            return { safeTxHash };
        });
    }
    getSafeTransactionHash(walletAddress, transactionData, chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            return ethers_1.ethers.utils._TypedDataEncoder.hash({
                chainId,
                verifyingContract: walletAddress
            }, constants_1.EIP712_SAFE_TX_TYPES, transactionData);
        });
    }
    getSuccessExecTransactionEvent(safeTxHash) {
        return __awaiter(this, void 0, void 0, function* () {
            const safeInstance = yield factories_1.Safe__factory.connect(this.getAddress(), this.getOwnerProvider());
            const transactionEvents = yield safeInstance.queryFilter(safeInstance.filters.ExecutionSuccess(), constants_1.BLOCK_EVENT_GAP);
            const filteredTransactionEvent = transactionEvents.filter((e) => e.args.txHash === safeTxHash);
            return filteredTransactionEvent[0];
        });
    }
    getFailedExecTransactionEvent(safeTxHash) {
        return __awaiter(this, void 0, void 0, function* () {
            const safeInstance = yield factories_1.Safe__factory.connect(this.getAddress(), this.getOwnerProvider());
            const transactionEvents = yield safeInstance.queryFilter(safeInstance.filters.ExecutionFailure(), constants_1.BLOCK_EVENT_GAP);
            const filteredTransactionEvent = transactionEvents.filter((e) => e.args.txHash === safeTxHash);
            return filteredTransactionEvent[0];
        });
    }
    /**
     * WebAuthn Section
     */
    addWebAuthnOwner() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const signer = (_a = this.authAdapter.getEthProvider()) === null || _a === void 0 ? void 0 : _a.getSigner();
            if (!signer)
                throw new Error('No signer found');
            const webAuthnCredentials = yield WebAuthn_1.default.createCredentials(this.getAddress());
            const publicKey_X = `0x${webAuthnCredentials.point.getX().toString(16)}`;
            const publicKey_Y = `0x${webAuthnCredentials.point.getY().toString(16)}`;
            const publicKey_Id = webAuthnCredentials.id;
            const message = `${publicKey_X},${publicKey_Y},${publicKey_Id}`;
            const signature = yield this.signMessage(ethers_1.ethers.utils.hexlify(ethers_1.ethers.utils.toUtf8Bytes(message)));
            yield this.API.addWebAuthnOwner(this.getAddress(), publicKey_Id, publicKey_X, publicKey_Y, signature, message, undefined);
            const signerAddress = yield this.getWebAuthnSigner(publicKey_X, publicKey_Y);
            yield this.API.addWebAuthnOwner(this.getAddress(), publicKey_Id, publicKey_X, publicKey_Y, signature, message, signerAddress);
            const safeTxHash = yield this.addOwner(signerAddress);
            this.webAuthnOwners = yield this.API.getWebAuthnOwners(this.getAddress());
            return safeTxHash;
        });
    }
    getWebAuthnSigner(publicKey_X, publicKey_Y) {
        return __awaiter(this, void 0, void 0, function* () {
            const P256FactoryInstance = yield factories_1.P256SignerFactory__factory.connect(constants_1.networks[this.chainId].P256FactoryContractAddress, this.getOwnerProvider());
            let signerDeploymentEvent = [];
            while (signerDeploymentEvent.length === 0) {
                yield new Promise((resolve) => setTimeout(resolve, 2000));
                signerDeploymentEvent = yield P256FactoryInstance.queryFilter(P256FactoryInstance.filters.NewSignerCreated(publicKey_X, publicKey_Y), constants_1.BLOCK_EVENT_GAP);
            }
            return signerDeploymentEvent[0].args.signer;
        });
    }
    _verifyWebAuthnOwner() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.webAuthnOwners)
                throw new Error('No WebAuthn signer found');
            const storedWebAuthnPublicKeyId = window.localStorage.getItem('public-key-id');
            if (!this.webAuthnOwners.filter((webAuthnOwner) => webAuthnOwner.publicKey_Id === storedWebAuthnPublicKeyId)) {
                throw new Error('WebAuthn credentials stored in storage are not linked to an added device');
            }
        });
    }
    _signTransactionwithWebAuthn(safeTxDataTyped) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.webAuthnOwners)
                throw new Error('No WebAuthn signer found');
            const safeTxHash = yield this.getSafeTransactionHash(this.getAddress(), safeTxDataTyped, this.chainId);
            const encodedWebauthnSignature = yield WebAuthn_1.default.getWebAuthnSignature(safeTxHash, this.webAuthnOwners[0].publicKey_Id);
            return `${ethers_1.ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256'], [this.webAuthnOwners[0].signerAddress, 65])}00${ethers_1.ethers.utils
                .hexZeroPad(ethers_1.ethers.utils.hexValue(448), 32)
                .slice(2)}${encodedWebauthnSignature.slice(2)}`;
        });
    }
}
exports.AlembicWallet = AlembicWallet;
