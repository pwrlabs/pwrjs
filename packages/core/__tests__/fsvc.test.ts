// 3rd party
import * as fs from 'fs';

import { IFalconService } from '../src/services/falcon/c';
import FalconServiceNode from '../src/services/falcon/falcon-node.service';

const path = require('path') as typeof import('path');

describe('', () => {
    const service: IFalconService = new FalconServiceNode();

    const json = fs.readFileSync(
        path.resolve(__dirname, 'files', 'falconjava.json'),
        'utf-8'
    );

    const encoder = new TextEncoder();

    const javaSign = JSON.parse(json) as {
        message: string;
        signature: string;
        pubkey: string;
    };

    test('test service itself', async () => {
        const keypair = await service.generateKeyPair();

        const message = encoder.encode('hello');

        const signature = await service.sign(message, keypair.pk, keypair.sk);

        const valid = await service.verify(message, keypair.pk, signature);

        expect(keypair).toHaveProperty('pk');
        expect(keypair).toHaveProperty('sk');
        expect(signature).toBeDefined();
        expect(valid).toBe(true);
    });

    test('test signature from remote end', async () => {
        const valid = await service.verify(
            encoder.encode(javaSign.message),
            { H: javaSign.pubkey },
            javaSign.signature
        );

        console.log('java sign', { valid });

        expect(valid).toBe(true);
    });

    test('test signature altered', async () => {
        const valid = await service.verify(
            encoder.encode(javaSign.message),
            { H: 'fake' },
            javaSign.signature
        );

        expect(valid).toBe(false);
    });

    test('test fail', async () => {
        const keypair = await service.generateKeyPair();

        const fakepk = {
            H: 'fakepk',
        };

        const message = encoder.encode('hello');

        const signature = await service.sign(message, fakepk, keypair.sk);
    });

    // test('export signature', async () => {
    //     const falcon: Falcon512 = await getKernel('falcon512_n3_v1');
    //     const keypair: FalconKeyPair = falcon.genkey();
    //     const message = new TextEncoder().encode('hello');
    //     const signature = falcon.sign(message, keypair.sk);
    //     const pubkey = keypair.pk;
    //     const content = JSON.stringify({
    //         message: Buffer.from(message).toString('base64'),
    //         signature: Buffer.from(signature).toString('base64'),
    //         pubkey: Buffer.from(pubkey).toString('base64'),
    //     });
    //     const filePath = path.resolve(__dirname, 'files', 'falconsign.json');
    //     fs.writeFileSync(filePath, content);
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
    // test('verify signature', async () => {
    //     const falcon: Falcon512 = await getKernel('falcon512_n3_v1');
    //     const keypair = falcon.genkey();
    //     const filePath = path.resolve(__dirname, 'files', 'falconpy.json');
    //     const content = fs.readFileSync(filePath, 'utf-8');
    //     const { message, signature, pubkey } = JSON.parse(content);
    //     console.log({ message, signature, pubkey });
    //     // base64 to buffer
    //     const messageBuffer = Uint8Array.from(Buffer.from(message, 'hex'));
    //     const messageStr = new TextDecoder().decode(messageBuffer);
    //     const signatureBuffer = Uint8Array.from(Buffer.from(signature, 'hex'));
    //     const pubkeyBuffer = Uint8Array.from(Buffer.from(pubkey, 'hex'));
    //     expect(messageStr).toBe('hello');
    //     const verified = falcon.verify(
    //         signatureBuffer,
    //         messageBuffer,
    //         keypair.pk
    //     );
    //     expect(verified).toBe(true);
    // });
    // test('verify java signature', async () => {
    //     const f = await falcon.keyPair();
    //     const filePath = path.resolve(__dirname, 'files', 'falconjava.json');
    //     const content = fs.readFileSync(filePath, 'utf-8');
    //     const { message, signature, pubkey } = JSON.parse(content);
    //     // base64 to buffer
    //     const messageBuffer = new TextEncoder().encode(message);
    //     const signatureBuffer = Uint8Array.from(Buffer.from(signature, 'hex'));
    //     const pubkeyBuffer = Uint8Array.from(Buffer.from(pubkey, 'hex'));
    //     console.log({
    //         pubkeylen: pubkeyBuffer.length,
    //         signaturelen: signatureBuffer.length,
    //         messagelen: messageBuffer.length,
    //     });
    //     const verified = falcon.open(signatureBuffer, pubkeyBuffer);
    //     // expect(verified).toBe(true);
    // });
    // test('verify py signature', async () => {
    //     const falcon: Falcon512 = await getKernel('falcon512_n3_v1');
    //     //     const f = await falcon.keyPair();
    //     const filePath = path.resolve(__dirname, 'files', 'falconpy.json');
    //     const content = fs.readFileSync(filePath, 'utf-8');
    //     const { message, signature, pubkey } = JSON.parse(content);
    //     // base64 to buffer
    //     const messageBuffer = new TextEncoder().encode(message);
    //     const signatureBuffer = Uint8Array.from(Buffer.from(signature, 'hex'));
    //     const pubkeyBuffer = Uint8Array.from(Buffer.from(pubkey, 'hex'));
    //     console.log({
    //         pubkeylen: pubkeyBuffer.length,
    //         signaturelen: signatureBuffer.length,
    //         messagelen: messageBuffer.length,
    //     });
    //     const verified = falcon.verify(
    //         signatureBuffer,
    //         messageBuffer,
    //         pubkeyBuffer
    //     );
    //     expect(verified).toBe(true);
    // });
    // test('library 3', async () => {
    //     const keyPair = await falcon.keyPair();
    //     const message = new TextEncoder().encode('hello');
    //     const signature = await falcon.signDetached(
    //         message,
    //         keyPair.privateKey
    //     );
    //     const isValid = await falcon.verifyDetached(
    //         signature,
    //         message,
    //         keyPair.publicKey
    //     );
    //     console.log({
    //         keyPair,
    //         message,
    //         signature,
    //         isValid,
    //     });
    // });
});
