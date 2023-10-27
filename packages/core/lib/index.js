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
const wallet_utils_1 = require("./wallet.utils");
const wallet_1 = require("./wallet/wallet");
const axios_1 = require("axios");
const bignumber_js_1 = require("bignumber.js");
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
_a = PWR;
_PWR_rpcNodeUrl = { value: 'https://pwrexplorerbackend.pwrlabs.io' };
_PWR_feePerByte = { value: 100 };
const randomPk = wallet_utils_1.default.getRandomWallet();
const wallet = new wallet_1.default(randomPk.getPrivateKeyString());
function testWallet() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('testing wallet');
        const pk = wallet.getPrivateKey();
        const address = wallet.getAddress();
        const nonce = yield wallet.getNonce();
        console.log('props', {
            pk,
            address,
            nonce,
        });
        const res = yield (0, axios_1.default)({
            method: 'post',
            url: `https://pwrfaucet.pwrlabs.io/claimPWR/?userAddress=${wallet.getAddress()}`,
        });
        yield new Promise((resolve) => setTimeout(resolve, 10 * 1000));
        const balance = yield wallet.getBalance();
        console.log('balance', (0, bignumber_js_1.default)(balance).shiftedBy(-9).toString());
        try {
            if (balance > 0) {
                const res2 = yield wallet.transferPWR('0xcad2114baa0def4b94771e6be5d4044185702b65', (0, bignumber_js_1.default)(1).shiftedBy(9).toString());
                yield new Promise((resolve) => setTimeout(resolve, 5 * 1000));
                console.log(res2);
                const bal2 = yield wallet.getBalance();
                const bal2Dec = (0, bignumber_js_1.default)(bal2).shiftedBy(-9).toString();
                const p2 = {
                    balance: bal2Dec,
                };
                console.log('wallet second state', p2);
                yield new Promise((res) => setTimeout(res, 5 * 1000));
                console.log('------------------ data txn ------------------');
                const data = 'Hello World';
                const dataBytes = Buffer.from(data);
                const dataTxn = yield wallet.sendVMDataTxn('8', dataBytes);
                console.log('data txn', dataTxn);
            }
        }
        catch (err) {
            console.log(err.message);
        }
    });
}
function testTool() {
    return __awaiter(this, void 0, void 0, function* () {
        const rpc = PWR.getRpcNodeUrl();
        const fee = PWR.getFeePerByte();
        console.log('props', {
            rpc,
            fee,
        });
        const address = wallet.getAddress();
        try {
            const balance = yield PWR.getBalanceOfAddress(address);
            const nonce = yield PWR.getNonceOfAddress(address);
            console.log({
                balance,
                nonce,
            });
        }
        catch (err) {
            console.log(err.message);
        }
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        yield testTool();
    });
}
main();
