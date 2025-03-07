import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import {
    COMMAND,
    FalconJar,
    FalconKeyPair,
    FalconPrivateKey,
    FalconPublicKey,
    IFalconService,
    SignatureResponse,
} from './c';

// Falcon service uses a jar file to interact with the falcon algorithm
// this should be refactored and use a nativa javascript implementation
// this class asumes that cheerpj is already installed and is available in
// window.cheerpj
export default class FalconServiceBrowser implements IFalconService {
    constructor(private readonly jar: FalconJar) {}

    async generateKeyPair(): Promise<FalconKeyPair> {
        const res = await this.jar.processCommand([COMMAND.GENKEY]);

        const keypair = JSON.parse(res) as {
            f: string;
            F: string;
            G: string;
            H: string;
        };

        return {
            pk: { H: keypair.H },
            sk: { f: keypair.f, F: keypair.F, G: keypair.G },
        };
    }

    async sign(
        message: Uint8Array,
        pk: FalconPublicKey,
        sk: FalconPrivateKey
    ): Promise<string> {
        const msg = bytesToHex(message);
        const res = await this.jar.processCommand([
            COMMAND.SIGN,
            msg,
            sk.f,
            sk.F,
            sk.G,
            pk.H,
        ]);

        const { signature } = JSON.parse(res) as SignatureResponse;
        return signature;
    }

    async verify(
        message: Uint8Array,
        pk: FalconPublicKey,
        signature: string
    ): Promise<boolean> {
        const msg = bytesToHex(message);
        const res = await this.jar.processCommand([
            COMMAND.VERIFY,
            msg,
            pk.H,
            signature,
        ]);

        const { valid } = JSON.parse(res) as { valid: boolean };

        return valid;
    }
}
