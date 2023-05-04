"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Modal = void 0;
const react_1 = __importDefault(require("react"));
function Modal({ onDeny, onAccept, txGasFees }) {
    const style = {
        margin: 'auto',
        padding: '16px',
        width: '50%',
        height: 'auto',
        borderRadius: '16px',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        justifyContent: 'center',
        alignItems: 'center'
    };
    const buttonStyle = {
        padding: '8px 16px',
        borderRadius: '8px',
        backgroundColor: '#101010',
        color: 'white',
        fontFamily: 'sans-serif',
        fontSize: '16px',
        margin: '0 8px'
    };
    const acceptBtnStyle = Object.assign(Object.assign({}, buttonStyle), { backgroundColor: '#00ff00' });
    const denyBtnStyle = Object.assign(Object.assign({}, buttonStyle), { backgroundColor: '#ff0000' });
    const textStyle = {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#101010',
        marginBottom: '24px'
    };
    return (react_1.default.createElement("div", { style: style },
        react_1.default.createElement("p", { style: textStyle },
            "This tx is gonna cost: ",
            txGasFees),
        react_1.default.createElement("button", { style: acceptBtnStyle, onClick: onAccept }, "Continue"),
        react_1.default.createElement("button", { style: denyBtnStyle, onClick: onDeny }, "Cancel")));
}
exports.Modal = Modal;
