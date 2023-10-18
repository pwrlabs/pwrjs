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
var _PWR_baseUrl;
Object.defineProperty(exports, "__esModule", { value: true });
const bip39_1 = require("bip39");
const wallet_utils_1 = require("./wallet.utils");
const wallet_1 = require("./wallet/wallet");
const axios_1 = require("axios");
class PWR {
    constructor() {
        _PWR_baseUrl.set(this, 'https://pwrexplorerbackend.pwrlabs.io');
    }
    static createWallet() {
        const mnemonic = wallet_utils_1.default.generateMnemonic();
        const wallet = wallet_utils_1.default.getWalletFromMnemonic(mnemonic);
        const pwrWallet = new wallet_1.default(wallet.getPrivateKeyString());
        return {
            wallet: pwrWallet,
            mnemonic,
        };
    }
    static importWalletFromMnemonic(mnemonic) {
        const valid = (0, bip39_1.validateMnemonic)(mnemonic);
        if (!valid) {
            throw new Error('Invalid mnemonic');
        }
        const wallet = wallet_utils_1.default.getWalletFromMnemonic(mnemonic);
        const pwrWallet = new wallet_1.default(wallet.getPrivateKeyString());
        return pwrWallet;
    }
    static importWalletFromPrivateKey(privateKey) {
        const wallet = wallet_utils_1.default.fromPrivateKey(privateKey);
        const pwrWallet = new wallet_1.default(wallet.getPrivateKeyString());
        return pwrWallet;
    }
    static getBalance(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield (0, axios_1.default)({
                method: 'get',
                url: `https://pwrexplorerbackend.pwrlabs.io/balanceOf/userAddress=${address}`,
            });
            if (res.data.status !== 'success') {
                throw new Error('Error getting balance');
            }
            return res.data.data.balance;
        });
    }
    static getTransactions(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield (0, axios_1.default)({
                method: 'get',
                url: `https://pwrexplorerbackend.pwrlabs.io/transactionsOf/userAddress=${address}`,
            });
            if (res.data.status !== 'success') {
                throw new Error('Error getting transactions');
            }
            return res.data.data.txns;
        });
    }
}
_PWR_baseUrl = new WeakMap();
const { wallet } = PWR.createWallet();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield (0, axios_1.default)({
                method: 'post',
                url: `https://pwrfaucet.pwrlabs.io/claimPWR/?userAddress=${wallet.address}`,
            });
            console.log('wallet', wallet.address);
            yield new Promise((resolve) => setTimeout(resolve, 15 * 1000));
            const balance = yield wallet.getBalance();
            const p = {
                address: wallet.address,
                balance,
            };
            if (balance > 0) {
                console.log('wallet', p);
                const res2 = yield wallet.sendTransaction('0xcad2114baa0def4b94771e6be5d4044185702b65', '1000000000 ');
                console.log(res2);
            }
        }
        catch (err) {
            console.log(err.message);
        }
    });
}
main();
