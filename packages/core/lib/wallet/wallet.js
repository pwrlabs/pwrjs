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
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const wallet_utils_1 = require("../wallet.utils");
const bignumber_js_1 = require("bignumber.js");
const utils_1 = require("../utils");
const js_sha3_1 = require("js-sha3");
const secp256k1 = require("secp256k1");
const url = 'https://pwrexplorerbackend.pwrlabs.io';
function generateDataTxnBytes(id, nonce, vmId, data) {
    const idDec = id;
    const nonceDec = nonce;
    const vmIdBN = (0, bignumber_js_1.default)(vmId);
    const idByte = (0, utils_1.decToBytes)(idDec, 1);
    const nonceByte = (0, utils_1.decToBytes)(nonceDec, 4);
    const vmIdByte = (0, utils_1.BnToBytes)(vmIdBN);
    const dataByte = new Uint8Array(Buffer.from(data, 'hex'));
    const txnBytes = new Uint8Array([
        ...idByte,
        ...nonceByte,
        ...vmIdByte,
        ...dataByte,
    ]);
    return txnBytes;
}
function generateTxnBytes(id, nonce, amount, recipientSr) {
    const idDec = id;
    const nonceDec = nonce;
    const amountBN = (0, bignumber_js_1.default)(amount);
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
class PWRWallet {
    constructor(privateKey) {
        const wallet = wallet_utils_1.default.fromPrivateKey(privateKey);
        this.privateKey = wallet.getPrivateKeyString();
        this.address = wallet.getAddressString();
    }
    getAddress() {
        const wallet = wallet_utils_1.default.fromPrivateKey(this.privateKey);
        const address = wallet.getAddressString();
        return address;
    }
    getBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield (0, axios_1.default)({
                method: 'get',
                url: `${url}/balanceOf/?userAddress=${this.address}`,
            });
            if (res.data.status !== 'success') {
                throw new Error('Error getting balance');
            }
            return res.data.data.balance;
        });
    }
    getNonce() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield (0, axios_1.default)({
                method: 'get',
                url: `${url}/nonceOfUser/?userAddress=${this.address}`,
            });
            if (res.data.status !== 'success') {
                throw new Error('Error getting nonce');
            }
            return res.data.data.nonce;
        });
    }
    getPrivateKey() {
        return this.privateKey;
    }
    transferPWR(to, amount, nonce) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = 0;
            const _nonce = nonce || (yield this.getNonce());
            const txnDataBytes = generateTxnBytes(id, _nonce, amount, to);
            const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);
            const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
            const txnHex = Buffer.from(txnBytes).toString('hex');
            const res = yield (0, axios_1.default)({
                method: 'post',
                url: `${url}/broadcast/`,
                data: {
                    txn: txnHex,
                },
            });
            if (res.data.status !== 'success') {
                throw new Error('Error sending transaction');
            }
            return res.data.data;
        });
    }
    sendVMDataTxn(vmId, dataBytes, nonce) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = 5;
            const _nonce = nonce || (yield this.getNonce());
            const _vmId = vmId;
            const data = (0, utils_1.bytesToHex)(dataBytes);
            const txnDataBytes = generateDataTxnBytes(id, _nonce, _vmId, data);
            const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);
            const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
            const txnHex = Buffer.from(txnBytes).toString('hex');
            const res = yield (0, axios_1.default)({
                method: 'post',
                url: `${url}/broadcast/`,
                data: {
                    txn: txnHex,
                },
            });
            if (res.data.status !== 'success') {
                throw new Error('Error sending transaction');
            }
            return res.data.data;
        });
    }
}
exports.default = PWRWallet;
