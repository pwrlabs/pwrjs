import PWRJS from '@pwrjs/core';
import { AbstractWallet } from '@pwrjs/core/wallet';

import FalconSvc from '../services/falcon-node.service';

export default class Falcon512Wallet extends AbstractWallet {
    constructor(privateKey: Uint8Array, publicKey: Uint8Array, pwr: PWRJS) {
        super(privateKey, publicKey, pwr);
    }

    static async new(pwr: PWRJS): Promise<Falcon512Wallet> {
        const keys = await FalconSvc.generateKeyPair();
        return Falcon512Wallet.fromKeys(keys.sk, keys.pk, pwr);
    }

    static fromKeys(privateKey: Uint8Array, publicKey: Uint8Array, pwr: PWRJS): Falcon512Wallet {
        return new Falcon512Wallet(privateKey, publicKey, pwr);
    }

    async sign(data: Uint8Array): Promise<Uint8Array> {
        return FalconSvc.sign(data, this._privateKey);
    }

    async verifySignature(data: Uint8Array, signature: Uint8Array): Promise<boolean> {
        return FalconSvc.verify(data, this._publicKey, signature);
    }
}
