import { FalconKeyPair, FalconService } from '@pwrjs/core-beta/services';
import kemBuilder from '@dashlane/pqc-sign-falcon-512-node';

export default class FalconServiceNode extends FalconService {
    private static async getFalcon512() {
        return kemBuilder();
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
}
