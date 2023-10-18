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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _PwrWallet__address, _PwrWallet__privateKey;
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const wallet_utils_1 = require("../wallet.utils");
const bignumber_js_1 = require("bignumber.js");
const utils_1 = require("../utils");
const js_sha3_1 = require("js-sha3");
const secp256k1 = require("secp256k1");
const url = 'https://pwrexplorerbackend.pwrlabs.io';
function generateTxnBytes(id, nonce, amount, recipientSr) {
    const idDec = id;
    const nonceDec = Math.floor(Math.random() * Math.pow(2, 32));
    const amountBN = (0, bignumber_js_1.default)(amount).shiftedBy(9);
    const recipient = recipientSr.replace('0x', '');
    const idByte = (0, utils_1.decToBytes)(idDec, 1);
    const nonceByte = (0, utils_1.decToBytes)(nonceDec, 4);
    const amountByte = (0, utils_1.BnToBytes)(amountBN);
    const recipientByte = new Uint8Array(Buffer.from(recipient, 'hex'));
    const txnBytes = new Uint8Array([
        ...idByte,
        ...nonceByte,
        ...amountByte,
        ...recipientByte,
    ]);
    return txnBytes;
}
function hashTxn(txnBytes) {
    const hashedTxn = js_sha3_1.keccak256.arrayBuffer(txnBytes);
    return hashedTxn;
}
function signTxn(txnBytes, privateKey) {
    const hashedBytes = js_sha3_1.keccak256.arrayBuffer(txnBytes);
    const privateKeyBytes = new Uint8Array(Buffer.from(privateKey.slice(2), 'hex'));
    const signObj = secp256k1.ecdsaSign(new Uint8Array(hashedBytes), privateKeyBytes);
    const signature = Buffer.concat([
        signObj.signature,
        Buffer.from([signObj.recid + 27]),
    ]);
    return signature;
}
class PwrWallet {
    constructor(privateKey) {
        _PwrWallet__address.set(this, void 0);
        _PwrWallet__privateKey.set(this, void 0);
        const wallet = wallet_utils_1.default.fromPrivateKey(privateKey);
        __classPrivateFieldSet(this, _PwrWallet__address, wallet.getAddressString(), "f");
        __classPrivateFieldSet(this, _PwrWallet__privateKey, wallet.getPrivateKeyString(), "f");
    }
    get address() {
        return __classPrivateFieldGet(this, _PwrWallet__address, "f");
    }
    getBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield (0, axios_1.default)({
                method: 'get',
                url: `${url}/balanceOf/?userAddress=${__classPrivateFieldGet(this, _PwrWallet__address, "f")}`,
            });
            if (res.data.status !== 'success') {
                throw new Error('Error getting balance');
            }
            return res.data.data.balance;
        });
    }
    getTransactions() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield (0, axios_1.default)({
                method: 'get',
                url: `${url}/transactionHistory/?address=${__classPrivateFieldGet(this, _PwrWallet__address, "f")}`,
            });
            if (res.data.status !== 'success') {
                throw new Error('Error getting transactions');
            }
            return res.data.data.txns;
        });
    }
    sendTransaction(recipient, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = 0;
            const randomNonce = Math.floor(Math.random() * Math.pow(2, 32));
            const txnDataBytes = generateTxnBytes(id, randomNonce, amount, recipient);
            const signedTxnBytes = signTxn(txnDataBytes, __classPrivateFieldGet(this, _PwrWallet__privateKey, "f"));
            const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
            const hashedTxnFinal = hashTxn(txnBytes);
            const hashedTxnStr = Buffer.from(hashedTxnFinal).toString('hex');
            const res = yield (0, axios_1.default)({
                method: 'post',
                url: `${url}/broadcast/`,
                data: {
                    txn: hashedTxnStr,
                },
            });
            if (res.data.status !== 'success') {
                throw new Error('Error sending transaction');
            }
            return res.data.data;
        });
    }
}
exports.default = PwrWallet;
_PwrWallet__address = new WeakMap(), _PwrWallet__privateKey = new WeakMap();
