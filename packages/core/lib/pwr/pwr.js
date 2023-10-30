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
var _a, _PWRJS_rpcNodeUrl, _PWRJS_feePerByte;
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
class PWRJS {
    static getRpcNodeUrl() {
        return __classPrivateFieldGet(PWRJS, _a, "f", _PWRJS_rpcNodeUrl);
    }
    static getNonceOfAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield (0, axios_1.default)({
                method: 'get',
                url: `${PWRJS.getRpcNodeUrl()}/nonceOfUser/?userAddress=${address}`,
            });
            if (res.data.status !== 'success') {
                throw new Error('Error getting nonce');
            }
            return res.data.data.nonce;
        });
    }
    static getBalanceOfAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${PWRJS.getRpcNodeUrl()}/balanceOf/?userAddress=${address}`;
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
        return __classPrivateFieldGet(PWRJS, _a, "f", _PWRJS_feePerByte);
    }
    static updateFeePerByte(feePerByte) {
        __classPrivateFieldSet(PWRJS, _a, feePerByte, "f", _PWRJS_feePerByte);
    }
    static setRpcNodeUrl(rpcNodeUrl) {
        __classPrivateFieldSet(PWRJS, _a, rpcNodeUrl, "f", _PWRJS_rpcNodeUrl);
    }
    static broadcastTxn(txnBytes) {
        return __awaiter(this, void 0, void 0, function* () {
            const txnHex = Buffer.from(txnBytes).toString('hex');
            const res = yield (0, axios_1.default)({
                method: 'post',
                url: `${PWRJS.getRpcNodeUrl()}/broadcast/`,
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
exports.default = PWRJS;
_a = PWRJS;
_PWRJS_rpcNodeUrl = { value: 'https://pwrexplorerbackend.pwrlabs.io' };
_PWRJS_feePerByte = { value: 100 };
