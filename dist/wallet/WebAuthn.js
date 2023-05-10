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
const helpers_1 = require("@simplewebauthn/server/helpers");
const cbor_js_1 = __importDefault(require("cbor-js"));
const elliptic_1 = require("elliptic");
const ethers_1 = require("ethers");
const utils_1 = require("../utils/utils");
const curve = new elliptic_1.ec('p256');
const PUBLIC_KEY_X = 'public-key-x';
const PUBLIC_KEY_Y = 'public-key-y';
const PUBLIC_KEY_ID_KEY = 'public-key-id';
const createCredentials = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const challenge = new TextEncoder().encode('connection');
    const webAuthnCredentials = yield navigator.credentials
        .create({
        publicKey: {
            rp: {
                name: 'wallet'
            },
            user: {
                id: new TextEncoder().encode(userId),
                name: 'user',
                displayName: 'user'
            },
            challenge,
            pubKeyCredParams: [{ alg: -7, type: 'public-key' }]
        }
    })
        .then((attestationPayload) => {
        var _a, _b;
        const attestation = cbor_js_1.default.decode((_a = attestationPayload === null || attestationPayload === void 0 ? void 0 : attestationPayload.response) === null || _a === void 0 ? void 0 : _a.attestationObject);
        const authData = (0, helpers_1.parseAuthenticatorData)(attestation.authData);
        const publicKey = cbor_js_1.default.decode((_b = authData === null || authData === void 0 ? void 0 : authData.credentialPublicKey) === null || _b === void 0 ? void 0 : _b.buffer);
        const x = publicKey[-2];
        const y = publicKey[-3];
        const point = curve.curve.point(x, y);
        window.localStorage.setItem(PUBLIC_KEY_X, point.getX().toString(16));
        window.localStorage.setItem(PUBLIC_KEY_Y, point.getY().toString(16));
        window.localStorage.setItem(PUBLIC_KEY_ID_KEY, (0, utils_1.hexArrayStr)(attestationPayload.rawId));
        return {
            point,
            id: (0, utils_1.hexArrayStr)(attestationPayload.rawId)
        };
    })
        .catch(console.error);
    return webAuthnCredentials;
});
const _sign = (challenge, publicKey_Id) => __awaiter(void 0, void 0, void 0, function* () {
    const assertionPayload = yield navigator.credentials.get({
        publicKey: {
            challenge,
            allowCredentials: [
                {
                    id: publicKey_Id,
                    type: 'public-key'
                }
            ]
        }
    });
    return assertionPayload === null || assertionPayload === void 0 ? void 0 : assertionPayload.response;
});
const getWebAuthnSignature = (safeTxHash, publicKey_Id) => __awaiter(void 0, void 0, void 0, function* () {
    const formattedPublicKeyId = (0, utils_1.parseHex)(publicKey_Id);
    const metaTxHash = safeTxHash;
    const challenge = (0, utils_1.parseHex)(metaTxHash.slice(2));
    const { signature, authenticatorData, clientDataJSON: clientData } = yield _sign(challenge, formattedPublicKeyId);
    const rs = (0, utils_1.derToRS)(new Uint8Array(signature));
    const challengeOffset = (0, utils_1.findSequence)(new Uint8Array(clientData), (0, utils_1.parseHex)('226368616c6c656e6765223a')) +
        12 +
        1;
    const encodedSignature = ethers_1.ethers.utils.defaultAbiCoder.encode(['bytes', 'bytes', 'uint256', 'uint256[2]'], [
        (0, utils_1.hexArrayStr)(authenticatorData),
        (0, utils_1.hexArrayStr)(clientData),
        challengeOffset,
        [(0, utils_1.hexArrayStr)(rs[0]), (0, utils_1.hexArrayStr)(rs[1])]
    ]);
    return encodedSignature;
});
exports.default = {
    createCredentials,
    getWebAuthnSignature
};
