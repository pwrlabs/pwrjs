// 3rd party
import { describe, test, expect } from 'vitest';
import { Falcon } from '../src/services/falcon.service';

describe('', () => {
    const encoder = new TextEncoder();

    test('test service itself', async () => {
        const keypair = await Falcon.generateKeypair512();

        const message = encoder.encode('hello');

        const signature = await Falcon.sign512(message, keypair.sk);

        const valid = await Falcon.verify512(
            message,
            signature,
            keypair.pk
        );

        expect(keypair).toHaveProperty('pk');
        expect(keypair).toHaveProperty('sk');
        expect(keypair.pk).toBeInstanceOf(Uint8Array);
        expect(keypair.sk).toBeInstanceOf(Uint8Array);
        expect(signature).toBeDefined();
        expect(signature).toBeInstanceOf(Uint8Array);
        expect(valid).toBe(true);
    });

    test('test fail', async () => {
        const keypair = await Falcon.generateKeypair512();

        const fakepk = new Uint8Array(2);

        const message = encoder.encode('hello');

        try {
            await Falcon.sign512(message, fakepk);
            expect(true).toBe(false);
        } catch (err) {
            expect(err).toBeDefined();
        }
    });
});
