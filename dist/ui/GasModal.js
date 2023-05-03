"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GasModal = void 0;
const react_1 = __importDefault(require("react"));
const client_1 = require("react-dom/client");
const Modal_1 = require("./components/Modal");
class GasModal {
    constructor({ modalConfig = {} }) {
        this.modalConfig = modalConfig;
    }
    createModalWrapper() {
        const root = document.querySelector(':root');
        root === null || root === void 0 ? void 0 : root.style.setProperty('--z-index-modal', this.modalConfig.zIndex || '1000');
        const existingWrapper = document.getElementById('alembic-gas-modal-wrapper');
        if (existingWrapper) {
            existingWrapper.remove();
        }
        const wrapper = document.createElement('section');
        wrapper.classList.add('modalWrapper');
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
    initModal() {
        const modalWrapper = this.createModalWrapper();
        const root = (0, client_1.createRoot)(modalWrapper);
        root.render(react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(Modal_1.Modal, { onClose: this.closeModal })));
    }
}
exports.GasModal = GasModal;
