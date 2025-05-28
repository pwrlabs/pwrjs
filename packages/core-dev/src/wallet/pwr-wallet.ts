import PWRJS from '../protocol/pwrjs';
import AbstractWallet from './abstract-wallet';
import { FalconService } from '../services/falcon-service';
import * as bip39 from 'bip39';

export default class PWRWallet extends AbstractWallet {
    constructor(privateKey: Uint8Array, publicKey: Uint8Array, pwr?: PWRJS) {
        super(privateKey, publicKey, pwr || new PWRJS('https://pwrrpc.pwrlabs.io'));
    }

    static new(seedPhrase: string, pwr?: PWRJS): PWRWallet {
        const seed = bip39.mnemonicToSeedSync(seedPhrase);
        const keys = FalconService.generateKeyPairFromSeed(seed);
        const wallet = PWRWallet.fromKeys(keys.sk, keys.pk, pwr);
        wallet.setSeedPhrase(seedPhrase);
        return wallet;
    }

    static newRandom(wordCount: number, pwr?: PWRJS): PWRWallet {
        let entropyBytes: number;
        switch (wordCount) {
            case 12:
                entropyBytes = 16; // 128 bits
                break;
            case 15:
                entropyBytes = 20; // 160 bits
                break;
            case 18:
                entropyBytes = 24; // 192 bits
                break;
            case 21:
                entropyBytes = 28; // 224 bits
                break;
            case 24:
                entropyBytes = 32; // 256 bits
                break;
            default:
                throw new Error(`Invalid word count: ${wordCount}`);
        }

        const entropy = new Uint8Array(entropyBytes);
        crypto.getRandomValues(entropy);

        const mnemonic = bip39.entropyToMnemonic(Buffer.from(entropy).toString('hex'));
        const seed = bip39.mnemonicToSeedSync(mnemonic);
        const keys = FalconService.generateKeyPairFromSeed(seed);
        
        const wallet = PWRWallet.fromKeys(keys.sk, keys.pk, pwr);
        wallet.setSeedPhrase(mnemonic);
        return wallet;
    }

    static fromKeys(privateKey: Uint8Array, publicKey: Uint8Array, pwr?: PWRJS): PWRWallet {
        return new PWRWallet(privateKey, publicKey, pwr);
    }

    async sign(data: Uint8Array): Promise<Uint8Array> {
        return FalconService.sign(data, this._privateKey);
    }

    async verifySignature(data: Uint8Array, signature: Uint8Array): Promise<boolean> {
        return FalconService.verify(data, this._publicKey, signature);
    }
}
