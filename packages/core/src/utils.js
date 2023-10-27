"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timestampToDate = exports.shortenAddress = exports.copyToClipboard = exports.BnToDecimal = exports.BnToBytes = exports.decToBytes = exports.bytesToHex = void 0;
const bignumber_js_1 = require("bignumber.js");
function bytesToHex(val) {
    return val.reduce((acc, curr) => acc + curr.toString(16).padStart(2, '0'), '');
}
exports.bytesToHex = bytesToHex;
function decToBytes(decimalNumber, numberOfBytes) {
    let bytes = new Uint8Array(numberOfBytes);
    for (let i = bytes.length - 1; i >= 0; i--) {
        bytes[i] = decimalNumber & 0xff;
        decimalNumber >>= 8;
    }
    return bytes;
}
exports.decToBytes = decToBytes;
function BnToBytes(BN) {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setUint32(0, BN.dividedToIntegerBy(0x100000000).toNumber(), false);
    view.setUint32(4, BN.mod(0x100000000).toNumber(), false);
    const bytes = new Uint8Array(buffer);
    return bytes;
}
exports.BnToBytes = BnToBytes;
function BnToDecimal(val, decimmals) {
    const bn = (0, bignumber_js_1.default)(val);
    const r = bn.shiftedBy(-decimmals).toFixed(2);
    return r;
}
exports.BnToDecimal = BnToDecimal;
function copyToClipboard(text) {
    return navigator.clipboard.writeText(text);
}
exports.copyToClipboard = copyToClipboard;
function shortenAddress(address) {
    const beginning = address.substring(0, 4);
    const end = address.substring(address.length - 6);
    return `${beginning}...${end}`;
}
exports.shortenAddress = shortenAddress;
function timestampToDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    const hour = date.getHours() % 12 || 12;
    const minute = date.getMinutes().toString().padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    return `${month} ${day}, ${year} at ${hour}:${minute} ${ampm}`;
}
exports.timestampToDate = timestampToDate;
