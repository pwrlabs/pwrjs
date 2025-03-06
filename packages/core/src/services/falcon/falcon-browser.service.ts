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
export class FalconServiceBrowser implements IFalconService {
    constructor(private readonly jar: FalconJar) {}

    async generateKeyPair(): Promise<FalconKeyPair> {
        const res = await this.jar.processCommand(COMMAND.GENKEY);

        const keypair = JSON.parse(res) as {
            f: string;
            F: string;
            G: string;
            h: string;
        };

        return {
            pk: { H: keypair.h },
            sk: { f: keypair.f, F: keypair.F, G: keypair.G },
        };
    }

    async sign(
        message: string,
        pk: FalconPublicKey,
        sk: FalconPrivateKey
    ): Promise<string> {
        const res = await this.jar.processCommand(
            COMMAND.SIGN,
            `"${message}"`,
            sk.f,
            sk.F,
            sk.G,
            pk.H
        );

        const { signature } = JSON.parse(res) as SignatureResponse;
        return signature;
    }

    async verify(
        message: string,
        pk: FalconPublicKey,
        signature: string
    ): Promise<boolean> {
        const res = await this.jar.processCommand(
            COMMAND.VERIFY,
            `"${message}"`,
            pk.H,
            signature
        );

        const { valid } = JSON.parse(res) as { valid: boolean };

        return valid;
    }
}
