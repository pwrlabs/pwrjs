import EthereumWallet from 'ethereumjs-wallet';
declare class WalletUtils {
    static fromPrivateKey(privateKeyStr: string): EthereumWallet;
    static generateMnemonic(): string;
    static getWalletFromMnemonic(mnemonicStr: string, accNumber?: number): EthereumWallet;
    static getRandomWallet(): EthereumWallet;
}
export default WalletUtils;
