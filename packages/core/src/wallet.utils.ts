import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import EthereumWallet from 'ethereumjs-wallet';
import hdkey from 'ethereumjs-wallet/dist/hdkey';

// import { bytesToHex } from '~shared/utils/functions';

class WalletUtils {
    // static fromPrivateKey(privateKey: string) {
    // 	const wallet = new Wallet(privateKey);
    // 	return wallet;
    // }

    static fromHex(privateKeyStr: string): EthereumWallet {
        const privateKeyBytes = Buffer.from(privateKeyStr.slice(2), 'hex');

        const wallet = EthereumWallet.fromPrivateKey(privateKeyBytes);
        return wallet;
    }

    static fromBytes(bytes: Uint8Array): EthereumWallet {
        const wallet = EthereumWallet.fromPrivateKey(Buffer.from(bytes));
        return wallet;
    }

    // static random(): Wallet {
    // 	const pk = crypto.getRandomValues(new Uint8Array(32));

    // 	const pkHex = bytesToHex(pk);
    // 	const wallet = new Wallet(pkHex);

    // 	return wallet;
    // }

    // static random2() {
    // 	const wallet = Wallet.createRandom();
    // 	return wallet;
    // }

    static generateMnemonic() {
        const mnemonic = generateMnemonic();
        return mnemonic;
    }

    static getWalletFromMnemonic(mnemonicStr: string, accNumber: number = 0) {
        const seed = mnemonicToSeedSync(mnemonicStr);

        // Generate HD Wallet from seed
        const hdWallet = hdkey.fromMasterSeed(seed);

        // Get the first account using the standard BIP44 derivation path for Ethereum
        const path = `m/44'/60'/0'/0/${accNumber}`;
        const wallet = hdWallet.derivePath(path).getWallet();

        // // Get the private key as a buffer
        // const privateKeyBuffer = wallet.getPrivateKey();

        // // Convert the private key buffer to a hex string
        // const privateKeyHex = privateKeyBuffer.toString('hex');

        // Get the account address

        return wallet;
    }

    static getRandomWallet(): EthereumWallet {
        const mnemonic = WalletUtils.generateMnemonic();
        const wallet = WalletUtils.getWalletFromMnemonic(mnemonic);
        return wallet;
    }
}

export default WalletUtils;
