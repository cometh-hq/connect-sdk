"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hexArrayStr = void 0;
const hexArrayStr = (array) => new Uint8Array(array).reduce((acc, v) => acc + v.toString(16).padStart(2, '0'), '0x');
exports.hexArrayStr = hexArrayStr;
