// node modules
import path = require('path');
import { promisify } from 'util';
import { exec } from 'child_process';

const execPromise = promisify(exec);

import { FalconService } from '../falcon/c';

// Falcon service uses a jar file to interact with the falcon algorithm
// this should be refactored and use a nativa javascript implementation

enum COMMAND {
    GENKEY = 'gen',
    SIGN = 'sign',
    VERIFY = 'verify',
}

type FalconJar = {
    processCommand: (args: string[]) => Promise<string>;
};

type FalconPublicKey = {
    H: string;
};

type FalconPrivateKey = {
    f: string;
    F: string;
    G: string;
};

type FalconKeyPair = {
    pk: FalconPublicKey;
    sk: FalconPrivateKey;
};

type KeyPairResponse = {
    f: string;
    F: string;
    G: string;
    H: string;
};

type SignatureResponse = {
    signature: string;
};

export default class JFalconServiceNode implements FalconService {
    // private PATH = path.join(__dirname, 'falcon.jar');

    static PATH = path.join(__dirname, 'falcon.jar');

    static async generateKeyPair(): Promise<FalconKeyPair> {
        const p = JFalconServiceNode.PATH;
        const res = await execPromise(`java -jar ${p} ${COMMAND.GENKEY}`);

        const { f, F, G, H } = JSON.parse(res.stdout) as KeyPairResponse;

        return {
            pk: { H: H },
            sk: { f: f, F: F, G: G },
        };
    }

    static async sign(
        message: Uint8Array,
        pk: FalconPublicKey,
        sk: FalconPrivateKey
    ): Promise<string> {
        const msg = Buffer.from(message).toString('hex');

        const p = JFalconServiceNode.PATH;

        const res = await execPromise(
            `java -jar ${p} ${COMMAND.SIGN} ${msg} ${sk.f} ${sk.F} ${sk.G} ${pk.H}`
        );
        const { signature } = JSON.parse(res.stdout) as SignatureResponse;
        return signature;
    }

    static async verify(
        message: Uint8Array,
        pk: FalconPublicKey,
        signature: string
    ): Promise<boolean> {
        const msg = Buffer.from(message).toString('hex');

        const p = JFalconServiceNode.PATH;

        const res = await execPromise(
            `java -jar ${p} ${COMMAND.VERIFY} ${msg} ${pk.H} ${signature}`
        );

        const { valid } = JSON.parse(res.stdout) as { valid: boolean };

        return valid;
    }
}
