import { FalconKeyPair, FalconService } from './c';
import kemBuilder from '@dashlane/pqc-sign-falcon-512-node';
import kemBuilder1024 from '@dashlane/pqc-sign-falcon-1024-node';

export default class FalconServiceNode extends FalconService {
    private static async getFalcon512() {
        return kemBuilder();
    }

    private static async getFalcon1024() {
        return kemBuilder1024();
    }

    static async generateKeyPair(): Promise<FalconKeyPair> {
        const falcon = await FalconServiceNode.getFalcon512();
        const { publicKey: pk, privateKey: sk } = await falcon.keypair();
        return { pk, sk };
    }

    static async sign(message: Uint8Array, sk: Uint8Array): Promise<Uint8Array> {
        const falcon = await FalconServiceNode.getFalcon512();
        const { signature } = await falcon.sign(message, sk);
        return signature;
    }

    // prettier-ignore
    static async verify(message: Uint8Array, pk: Uint8Array, signature: Uint8Array): Promise<boolean> {
        const falcon = await FalconServiceNode.getFalcon512();
        return falcon.verify(signature, message, pk);;
    }

    // 1024
    static async generateKeyPair1024(): Promise<FalconKeyPair> {
        const falcon = await FalconServiceNode.getFalcon1024();
        const { publicKey: pk, privateKey: sk } = await falcon.keypair();
        return { pk, sk };
    }

    static async sign1024(message: Uint8Array, sk: Uint8Array): Promise<Uint8Array> {
        const falcon = await FalconServiceNode.getFalcon1024();
        const { signature } = await falcon.sign(message, sk);
        return signature;
    }

    // prettier-ignore
    static async verify1024(message: Uint8Array, pk: Uint8Array, signature: Uint8Array): Promise<boolean> {
        const falcon = await FalconServiceNode.getFalcon1024();
        return falcon.verify(signature, message, pk);
    }
}
