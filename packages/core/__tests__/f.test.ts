// 3rd party
import { getKernel, getKernelNameList } from 'falcon-sign';

const fs = require('fs') as typeof import('fs');
const path = require('path') as typeof import('path');

interface FalconKeyPair {
    sk: Uint8Array;
    pk: Uint8Array;
    genkeySeed: Uint8Array;
}

interface Falcon512 {
    genkey(genkeySeed?: Uint8Array): FalconKeyPair;
    sign(message: Uint8Array, sk: Uint8Array): Uint8Array;
    verify(signedMsg: Uint8Array, message: Uint8Array, pk: Uint8Array): boolean;
}

describe('', () => {
    // test('verify signature', async () => {
    //     console.log(getKernelNameList);
    //     const falcon: Falcon512 = await getKernel('falcon512_n3_v1');
    //     const keypair: FalconKeyPair = falcon.genkey();
    //     const message = new TextEncoder().encode('hello');
    //     const signature = falcon.sign(message, keypair.sk);
    //     const pubkey = keypair.pk;
    //     const content = JSON.stringify({
    //         message: Buffer.from(message).toString('hex'),
    //         signature: Buffer.from(signature).toString('hex'),
    //         pubkey: Buffer.from(pubkey).toString('hex'),
    //     });
    //     const filePath = path.resolve(__dirname, 'files', 'falcon.json');
    //     fs.writeFileSync(filePath, content);
    //     const verified = falcon.verify(signature, message, pubkey);
    //     expect(verified).toBe(true);
    // });
    // it('from b64 to hex', () => {
    //     const filePath = path.resolve(__dirname, 'files', 'falconb64.json');
    //     const content = fs.readFileSync(filePath, 'utf-8');
    //     const { message, signature, pubkey } = JSON.parse(content);
    //     // base64 to buffer
    //     const messageBuffer = Uint8Array.from(Buffer.from(message, 'base64'));
    //     const messageStr = new TextDecoder().decode(messageBuffer);
    //     const signatureBuffer = Uint8Array.from(
    //         Buffer.from(signature, 'base64')
    //     );
    //     const pubkeyBuffer = Uint8Array.from(Buffer.from(pubkey, 'base64'));
    //     expect(messageStr).toBe('hello');
    //     const messageHex = Buffer.from(messageBuffer).toString('hex');
    //     const signatureHex = Buffer.from(signatureBuffer).toString('hex');
    //     const pubkeyHex = Buffer.from(pubkeyBuffer).toString('hex');
    //     const path2 = path.resolve(__dirname, 'files', 'falconhex.json');
    //     const content2 = JSON.stringify({
    //         message: messageHex,
    //         signature: signatureHex,
    //         pubkey: pubkeyHex,
    //     });
    //     fs.writeFileSync(path2, content2);
    // });

    test('verify signature', async () => {
        const falcon: Falcon512 = await getKernel('falcon512_n3_v1');
        const filePath = path.resolve(__dirname, 'files', 'falconhex.json');
        const content = fs.readFileSync(filePath, 'utf-8');
        const { message, signature, pubkey } = JSON.parse(content);

        console.log({ message, signature, pubkey });

        // base64 to buffer
        const messageBuffer = Uint8Array.from(Buffer.from(message, 'hex'));
        const messageStr = new TextDecoder().decode(messageBuffer);
        const signatureBuffer = Uint8Array.from(Buffer.from(signature, 'hex'));

        const pubkeyBuffer = Uint8Array.from(Buffer.from(pubkey, 'hex'));

        expect(messageStr).toBe('hello');

        const verified = falcon.verify(
            signatureBuffer,
            messageBuffer,
            pubkeyBuffer
        );
        expect(verified).toBe(true);
    });
});
