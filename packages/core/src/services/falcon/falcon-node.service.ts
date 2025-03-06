// node modules
import path = require('path');
import { promisify } from 'util';
import { exec } from 'child_process';

const execPromise = promisify(exec);

// services
import {
    COMMAND,
    FalconKeyPair,
    FalconPrivateKey,
    FalconPublicKey,
    IFalconService,
    KeyPairResponse,
    SignatureResponse,
} from './c';

// Falcon service uses a jar file to interact with the falcon algorithm
// this should be refactored and use a nativa javascript implementation

export class FalconServiceNode implements IFalconService {
    private PATH = path.join(__dirname, 'falcon.jar');

    async generateKeyPair(): Promise<FalconKeyPair> {
        const res = await execPromise(
            `java -jar ${this.PATH} ${COMMAND.GENKEY}`
        );

        const { f, F, G, H } = JSON.parse(res.stdout) as KeyPairResponse;

        return {
            pk: { H: H },
            sk: { f: f, F: F, G: G },
        };
    }

    async sign(
        message: string,
        pk: FalconPublicKey,
        sk: FalconPrivateKey
    ): Promise<string> {
        const res = await execPromise(
            `java -jar ${this.PATH} ${COMMAND.SIGN} "${message}" ${sk.f} ${sk.F} ${sk.G} ${pk.H}`
        );
        const { signature } = JSON.parse(res.stdout) as SignatureResponse;
        return signature;
    }

    async verify(
        message: string,
        pk: FalconPublicKey,
        signature: string
    ): Promise<boolean> {
        const res = await execPromise(
            `java -jar ${this.PATH} ${COMMAND.VERIFY} "${message}" ${pk.H} ${signature}`
        );

        const { valid } = JSON.parse(res.stdout) as { valid: boolean };

        return valid;
    }
}
