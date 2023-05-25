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
const WebAuthnUtils_1 = __importDefault(require("./WebAuthnUtils"));
const DEPLOYED_WEBAUTHN_SIGNER_ADDRESS = '0xc4c07CAD43fF6249c20129A2928D50D23A75fb09';
const CHAIN_ID = 137;
const publicKeyX = '0xaf0b3c3d191a70a11e2b0b0bc6216f3b960ad20dc0bb34920348fe7852e68d7a';
const publicKeyY = '0x40ed49be1573e8a5096adfefc36dfbdff42f1be69eed8b5355a08755ba7c17bc';
describe('WebAuthnService', () => {
    describe('predictSafeAddress', () => {
        it('Given an x and y, when predicting a deployed signer address, then return the correct address', () => __awaiter(void 0, void 0, void 0, function* () {
            const predictedAddress = yield WebAuthnUtils_1.default.predictSignerAddress(publicKeyX, publicKeyY, CHAIN_ID);
            expect(predictedAddress).toEqual(DEPLOYED_WEBAUTHN_SIGNER_ADDRESS);
        }));
    });
});
