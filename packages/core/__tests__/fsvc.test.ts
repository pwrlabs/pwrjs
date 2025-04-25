// 3rd party
import { describe, test, expect } from 'vitest';
import { Falcon } from '../src/services/falcon.service';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

import { pbkdf2Sync } from 'crypto';

import { Falcon512Wallet, PWRJS } from '../src';

import { hkdfSync } from 'crypto';
import crypto from 'crypto';
import HashService from '../src/services/hash.service';

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

    const pwr = new PWRJS('http://46.101.151.203:8085');

    test('test service itself', async () => {
        const keypair = await Falcon.generateKeypair512();

        const message = encoder.encode('hello');

        const signature = await Falcon.sign512(message, keypair.sk);

        const valid = await Falcon.verify512(message, signature, keypair.pk);

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
            // expect(true).toBe(false);
        } catch (err) {
            expect(err).toBeDefined();
        }
    });

    test('address generation', async () => {
        /**
         * Generates a 64-byte seed from a mnemonic and optional passphrase using PBKDF2 with HMAC-SHA512.
         * @param mnemonic - The mnemonic phrase.
         * @param passphrase - An optional passphrase.
         * @returns A Uint8Array representing the derived seed.
         * @throws Error if the mnemonic is empty or consists only of whitespace.
         */
        function generateSeed(mnemonic: string, passphrase?: string): Uint8Array {
            if (!mnemonic || mnemonic.trim().length === 0) {
                throw new Error('Mnemonic is required to generate a seed');
            }

            const encoder = new TextEncoder();
            const password = encoder.encode(mnemonic);
            const salt = encoder.encode(`mnemonic${passphrase ?? ''}`);

            const seed = pbkdf2Sync(password, salt, 2048, 64, 'sha512');
            return new Uint8Array(seed);
        }

        const mnemonic =
            'demand april length soap cash concert shuffle result force mention fringe slim';

        let seed = generateSeed(mnemonic);

        // add one more byte to the seed to derive the address path
        seed = new Uint8Array([...seed]);

        const harcodedSeed =
            '2246A57C783F18B07268FCF675486C3A45826C48F703062179EED5BBDF2BEE7A622EDDFEF7EDA803EC18E882CC8209893450DE472EE6049EE8C740327CA5F052';
        const expectedOutputHex =
            'EF91172C58D19AE4D465C58FED214A99D60A5BED95C7919B849132D787192FF58D19D2DA2A8F83F28BECFDF603BC5F35';

        const expectAddress = '0xE68191B7913E72E6F1759531FBFAA089FF02308A';

        // const prng = new SHA1PRNG2();
        // prng.setSeed(Buffer.from(seed));

        const randomGen = new DeterministicSecureRandom(Buffer.from(seed));

        const output1 = randomGen.nextBytes(48);

        const keypair = await Falcon.generateKeypair512(output1);

        console.log('pk_no_prefix', bytesToHex(keypair.pk.slice(1)));
        const hash = HashService.kekak224(keypair.pk.slice(1));
        const address = hash.slice(0, 20);

        console.log({
            mnemonic,
            hardcodedSeed: harcodedSeed,
            seed: bytesToHex(seed),
            sha1_bytes: bytesToHex(output1),
            address: '0x' + bytesToHex(address),
            pk: bytesToHex(keypair.pk),
        });

        // expect(harcodedSeed).toBe(bytesToHex(seed).toUpperCase());
        // expect(bytesToHex(output1).toUpperCase()).toBe(expectedOutputHex);
        // expect(bytesToHex(output2)).toBe(expectedOutputHex);

        return;
    });
});
