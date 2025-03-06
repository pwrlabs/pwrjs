import {
    COMMAND,
    FalconJar,
    FalconKeyPair,
    FalconPrivateKey,
    FalconPublicKey,
    IFalconService,
} from './falcon/c';

// Falcon service uses a jar file to interact with the falcon algorithm
// this should be refactored and use a nativa javascript implementation
// this class asumes that cheerpj is already installed and is available in
// window.cheerpj
export class FalconService implements IFalconService {
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
        throw new Error('Method not implemented.');
    }

    async verify(
        message: string,
        pk: FalconPublicKey,
        signature: string
    ): Promise<boolean> {
        throw new Error('Method not implemented.');
    }

    // async sign(
    //     message: string,
    //     pk: FalconPublicKey,
    //     sk: FalconKeyPair
    // ): Promise<string> {
    //     const httpSvc = new HttpService(this.endUrl);

    //     const res = await httpSvc.post<{ signature: string }>('/falcon/sign', {
    //         message,
    //         pk,
    //         sk,
    //     });

    //     return res.signature;
    // }

    // async verify(
    //     message: string,
    //     signature: string,
    //     pk: FalconPublicKey
    // ): Promise<boolean> {
    //     const httpSvc = new HttpService(this.endUrl);

    //     const body = {
    //         H: pk.H,
    //     };

    //     const res = await httpSvc.post<{ valid: boolean }>(
    //         '/falcon/verify',
    //         body
    //     );

    //     return res.valid;
    // }
}
