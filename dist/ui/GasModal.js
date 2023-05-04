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
exports.GasModal = void 0;
const react_1 = __importDefault(require("react"));
const client_1 = require("react-dom/client");
const Modal_1 = require("./components/Modal");
class GasModal {
    constructor(modalConfig) {
        this.modalConfig = modalConfig || {};
    }
    createModalWrapper() {
        const existingWrapper = document.getElementById('alembic-gas-modal-wrapper');
        if (existingWrapper) {
            existingWrapper.remove();
        }
        const wrapper = document.createElement('section');
        wrapper.setAttribute('style', ` position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: ${this.modalConfig.zIndex || '9999'};
        background-color: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        animation: alembic-gas-modal-fade-in 0.3s ease-out forwards;

        @keyframes alembic-gas-modal-fade-in {
          from {
            opactiy: 0;
          }
          to {
            opacity: 1;
          }
        }
      `);
        wrapper.setAttribute('id', 'alembic-gas-modal-wrapper');
        document.body.appendChild(wrapper);
        return wrapper;
    }
    closeModal() {
        const existingWrapper = document.getElementById('alembic-gas-modal-wrapper');
        if (existingWrapper) {
            existingWrapper.remove();
        }
    }
    initModal(txGasFees) {
        return __awaiter(this, void 0, void 0, function* () {
            const modalWrapper = this.createModalWrapper();
            const root = (0, client_1.createRoot)(modalWrapper);
            const self = this;
            return new Promise((resolve) => {
                console.log('ici');
                function accept() {
                    self.closeModal();
                    resolve(true);
                }
                function deny() {
                    self.closeModal();
                    resolve(false);
                }
                root.render(react_1.default.createElement(react_1.default.Fragment, null,
                    react_1.default.createElement(Modal_1.Modal, { onDeny: deny, onAccept: accept, txGasFees: txGasFees })));
            });
        });
    }
}
exports.GasModal = GasModal;
