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
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _a, _PWR_rpcNodeUrl, _PWR_feePerByte;
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
class PWR {
    static getRpcNodeUrl() {
        return __classPrivateFieldGet(PWR, _a, "f", _PWR_rpcNodeUrl);
    }
    static getNonceOfAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield (0, axios_1.default)({
                method: 'get',
                url: `${PWR.getRpcNodeUrl()}/nonceOfUser/?userAddress=${address}`,
            });
            if (res.data.status !== 'success') {
                throw new Error('Error getting nonce');
            }
            return res.data.data.nonce;
        });
    }
    static getBalanceOfAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${PWR.getRpcNodeUrl()}/balanceOf/?userAddress=${address}`;
            const res = yield (0, axios_1.default)({
                method: 'get',
                url,
            });
            if (res.data.status !== 'success') {
                throw new Error('Error getting balance');
            }
            return res.data.data.balance;
        });
    }
    static getFeePerByte() {
        return __classPrivateFieldGet(PWR, _a, "f", _PWR_feePerByte);
    }
    static updateFeePerByte(feePerByte) {
        __classPrivateFieldSet(PWR, _a, feePerByte, "f", _PWR_feePerByte);
    }
    static setRpcNodeUrl(rpcNodeUrl) {
        __classPrivateFieldSet(PWR, _a, rpcNodeUrl, "f", _PWR_rpcNodeUrl);
    }
    static broadcastTxn(txnBytes) {
        return __awaiter(this, void 0, void 0, function* () {
            const txnHex = Buffer.from(txnBytes).toString('hex');
            const res = yield (0, axios_1.default)({
                method: 'post',
                url: `${PWR.getRpcNodeUrl()}/broadcast/`,
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
exports.default = PWR;
_a = PWR;
_PWR_rpcNodeUrl = { value: 'https://pwrexplorerbackend.pwrlabs.io' };
_PWR_feePerByte = { value: 100 };
