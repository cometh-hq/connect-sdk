"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("@simplewebauthn/server/helpers");
const cbor_js_1 = __importDefault(require("cbor-js"));
const elliptic_1 = require("elliptic");
const curve = new elliptic_1.ec('p256');
const addOwner = (walletAddress) => {
    const challenge = new TextEncoder().encode('connection');
    let point;
    navigator.credentials
        .create({
        publicKey: {
            rp: {
                name: 'wallet'
            },
            user: {
                id: new TextEncoder().encode(walletAddress),
                name: 'user',
                displayName: 'user'
            },
            challenge,
            pubKeyCredParams: [{ alg: -7, type: 'public-key' }]
        }
    })
        .then((attestationPayload) => {
        var _a, _b;
        console.log(attestationPayload);
        const attestation = cbor_js_1.default.decode((_a = attestationPayload === null || attestationPayload === void 0 ? void 0 : attestationPayload.response) === null || _a === void 0 ? void 0 : _a.attestationObject);
        const authData = (0, helpers_1.parseAuthenticatorData)(attestation.authData);
        const publicKey = cbor_js_1.default.decode((_b = authData === null || authData === void 0 ? void 0 : authData.credentialPublicKey) === null || _b === void 0 ? void 0 : _b.buffer);
        const credentialId = authData === null || authData === void 0 ? void 0 : authData.credentialPublicKey;
        const x = publicKey[-2];
        const y = publicKey[-3];
        point = curve.curve.point(x, y);
        console.log({ point });
    })
        .catch(console.error);
    console.log(point);
    return point;
};
exports.default = {
    addOwner
};
