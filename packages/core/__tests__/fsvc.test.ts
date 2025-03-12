// 3rd party
import { describe, test, expect } from 'vitest';

import FalconServiceNode from '../src/services/falcon/falcon-node.service';
import kemBuilder from '@dashlane/pqc-sign-falcon-512-node';
import exp from 'constants';

const path = require('path') as typeof import('path');
const fs = require('fs') as typeof import('fs');

describe('', () => {
    // const service: IFalconService = new FalconServiceNode();

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
        const keypair = await FalconServiceNode.generateKeyPair();

        const message = encoder.encode('hello');

        const signature = await FalconServiceNode.sign(message, keypair.sk);

        const valid = await FalconServiceNode.verify(
            message,
            keypair.pk,
            signature
        );

        expect(keypair).toHaveProperty('pk');
        expect(keypair).toHaveProperty('sk');
        expect(keypair.pk).toBeInstanceOf(Uint8Array);
        expect(keypair.sk).toBeInstanceOf(Uint8Array);
        expect(signature).toBeDefined();
        expect(signature).toBeInstanceOf(Uint8Array);
        expect(valid).toBe(true);
    });

    test('test signature from remote end', async () => {
        const msg = encoder.encode(javaSign.message);
        const pubkey = Buffer.from(javaSign.pubkey, 'hex');
        const sign = Buffer.from(javaSign.signature, 'hex');

        const prefixByte = 0xb8;
        const output = new Uint8Array(pubkey.length + 1);
        output[0] = prefixByte; // set the prefix byte
        output.set(pubkey, 1);

        console.log(pubkey.length);

        const valid = await FalconServiceNode.verify(msg, sign, output);

        expect(valid).toBe(true);
    });

    test('test signature altered', async () => {
        const pubkey = Buffer.from(javaSign.pubkey, 'hex');
        const sign = Buffer.from(javaSign.signature, 'hex');

        const valid = await FalconServiceNode.verify(
            encoder.encode('altered msg'),
            sign,
            pubkey
        );

        expect(valid).toBe(false);
    });

    test('test fail', async () => {
        const keypair = await FalconServiceNode.generateKeyPair();

        const fakepk = new Uint8Array(2);

        const message = encoder.encode('hello');

        // const signature = await FalconServiceNode.sign(message, fakepk);

        try {
            await FalconServiceNode.sign(message, fakepk);
            expect(true).toBe(false);
        } catch (err) {
            expect(err).toBeDefined();
        }

        // test throw
    });
});
