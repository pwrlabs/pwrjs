import { expect, test, describe } from 'vitest';
import kemBuilder from '@dashlane/pqc-sign-falcon-512-node';

const path = require('path') as typeof import('path');
const fs = require('fs') as typeof import('fs');

describe('', () => {
    test('test service itself', async () => {
        const falcon = await kemBuilder();
        const keypair = await falcon.keypair();

        const message = Buffer.from('hello');
        const { signature: s } = await falcon.sign(message, keypair.privateKey);
        const valid = await falcon.verify(s, message, keypair.publicKey);

        expect(keypair).toHaveProperty('publicKey');
        expect(keypair).toHaveProperty('privateKey');
        expect(keypair.publicKey).toBeInstanceOf(Uint8Array);
        expect(keypair.privateKey).toBeInstanceOf(Uint8Array);
        expect(s).toBeDefined();
        expect(s).toBeInstanceOf(Uint8Array);
        expect(valid).toBe(true);
    });
});
