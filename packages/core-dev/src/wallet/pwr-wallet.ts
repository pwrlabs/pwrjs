import PWRJS from '../protocol/pwrjs';
import AbstractWallet from './abstract-wallet';
import FalconService from '../services/falcon-service';

export default class PWRWallet extends AbstractWallet {
    constructor(privateKey: Uint8Array, publicKey: Uint8Array, pwr: PWRJS) {
        super(privateKey, publicKey, pwr);
    }

    static async new(pwr: PWRJS): Promise<PWRWallet> {
        const keys = await FalconService.generateKeyPair();
        return PWRWallet.fromKeys(keys.sk, keys.pk, pwr);
    }

    static fromKeys(privateKey: Uint8Array, publicKey: Uint8Array, pwr: PWRJS): PWRWallet {
        return new PWRWallet(privateKey, publicKey, pwr);
    }

    async sign(data: Uint8Array): Promise<Uint8Array> {
        return FalconService.sign(data, this._privateKey);
    }

    async verifySignature(data: Uint8Array, signature: Uint8Array): Promise<boolean> {
        return FalconService.verify(data, this._publicKey, signature);
    }
}
