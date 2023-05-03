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
        window.localStorage.setItem(PUBLIC_KEY_ID_KEY, attestationPayload.id);
        return {
            point,
            id: attestationPayload.id
        };
    })
        .catch(console.error);
    return webAuthnCredentials;
});
exports.default = {
    createCredentials
};
