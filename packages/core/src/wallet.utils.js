"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bip39_1 = require("bip39");
const ethereumjs_wallet_1 = require("ethereumjs-wallet");
const hdkey_1 = require("ethereumjs-wallet/dist/hdkey");
class WalletUtils {
    static fromPrivateKey(privateKeyStr) {
        const privateKeyBytes = Buffer.from(privateKeyStr.slice(2), 'hex');
        const wallet = ethereumjs_wallet_1.default.fromPrivateKey(privateKeyBytes);
        return wallet;
    }
    static generateMnemonic() {
        const mnemonic = (0, bip39_1.generateMnemonic)();
        return mnemonic;
    }
    static getWalletFromMnemonic(mnemonicStr, accNumber = 0) {
        const seed = (0, bip39_1.mnemonicToSeedSync)(mnemonicStr);
        const hdWallet = hdkey_1.default.fromMasterSeed(seed);
        const path = `m/44'/60'/0'/0/${accNumber}`;
        const wallet = hdWallet.derivePath(path).getWallet();
        return wallet;
    }
    static getRandomWallet() {
        const mnemonic = WalletUtils.generateMnemonic();
        const wallet = WalletUtils.getWalletFromMnemonic(mnemonic);
        return wallet;
    }
}
exports.default = WalletUtils;
