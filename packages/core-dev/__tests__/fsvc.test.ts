// 3rd party
import { describe, test, expect } from 'vitest';
import { bytesToHex, hexToBytes } from '../utils';

import { falconKeypair } from 'rust-falcon';

import crypto from 'crypto';
import { HashService } from '../services';
import FalconService from '../src/services/falcon/rust-falcon.service';

import * as bip39 from 'bip39';

class DeterministicSecureRandom {
    private seed: Buffer;
    private counter: number;
    private digest: string;

    constructor(seed: Buffer | string, digest: string = 'sha256') {
        this.seed = typeof seed === 'string' ? Buffer.from(seed, 'hex') : Buffer.from(seed);
        this.counter = 0;
        this.digest = digest;
    }

    nextBytes(length: number): Buffer {
        const result = Buffer.alloc(length);
        let offset = 0;

        while (offset < length) {
            const hash = crypto.createHash(this.digest);
            hash.update(this.seed);
            const counterBuffer = Buffer.alloc(4);
            counterBuffer.writeUInt32BE(this.counter++, 0);
            hash.update(counterBuffer);
            const hashed = hash.digest();

            const toCopy = Math.min(hashed.length, length - offset);
            hashed.copy(result, offset, 0, toCopy);
            offset += toCopy;
        }

        return result;
    }
}

describe('', () => {
    const encoder = new TextEncoder();

    test('test service itself', async () => {
        const keypair = await FalconService.generateKeyPair();
        const message = encoder.encode('hello');
        const signature = await FalconService.sign(message, keypair.sk);
        const valid = await FalconService.verify(message, keypair.pk, signature);

        expect(keypair).toHaveProperty('pk');
        expect(keypair).toHaveProperty('sk');
        expect(keypair.pk).toBeInstanceOf(Uint8Array);
        expect(keypair.sk).toBeInstanceOf(Uint8Array);
        expect(signature).toBeDefined();
        expect(signature).toBeInstanceOf(Uint8Array);
        expect(valid).toBe(true);
    });

    test('test fail', async () => {
        const keypair = await FalconService.generateKeyPair();

        const fakepk = new Uint8Array(2);

        const message = encoder.encode('hello');

        try {
            await FalconService.sign(message, fakepk);
            expect(true).toBe(false);
        } catch (err) {
            expect(err).toBeDefined();
        }
    });

    test('address generation', async () => {
        const expectedSeed =
            '2246A57C783F18B07268FCF675486C3A45826C48F703062179EED5BBDF2BEE7A622EDDFEF7EDA803EC18E882CC8209893450DE472EE6049EE8C740327CA5F052';
        const expectedRandomBytes =
            'EF91172C58D19AE4D465C58FED214A99D60A5BED95C7919B849132D787192FF58D19D2DA2A8F83F28BECFDF603BC5F35';
        const expectAddress = '0xE68191B7913E72E6F1759531FBFAA089FF02308A';

        const mnemonic =
            'demand april length soap cash concert shuffle result force mention fringe slim';

        let seed = bip39.mnemonicToSeedSync(mnemonic, '');
        const randomBytes = new DeterministicSecureRandom(Buffer.from(seed)).nextBytes(48);

        const keypair = falconKeypair(randomBytes);

        const hash = HashService.kekak224(keypair.public.slice(1));
        const address = hash.slice(0, 20);

        // console.log({
        //     mnemonic,
        //     hardcodedSeed: expectedSeed,
        //     seed: bytesToHex(seed),
        //     random_bytes: bytesToHex(randomBytes),
        //     address: '0x' + bytesToHex(address),
        //     pk: bytesToHex(keypair.public),
        // });

        expect(expectedSeed).toBe(bytesToHex(seed).toUpperCase());
        expect(expectedRandomBytes).toBe(bytesToHex(randomBytes).toUpperCase());
        expect(expectAddress).toBe('0x' + bytesToHex(address).toUpperCase());
    });
});
