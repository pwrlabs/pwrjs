import { keccak_256, keccak_224 } from '@noble/hashes/sha3';

export default class HashService {
    static kekak224(input: Uint8Array): Uint8Array {
        return keccak_224(input);
    }

    static async hash224(input: Uint8Array | ArrayBuffer): Promise<Uint8Array> {
        if (
            typeof window !== 'undefined' &&
            typeof window.crypto !== 'undefined'
        ) {
            // Browser environment
            return HashService._webCryptoHash('SHA-3-224', input);
        } else {
            // Node.js environment
            return HashService._nodeCryptoHash('sha3-224', input);
        }
    }

    static async hash256(input: Uint8Array | ArrayBuffer): Promise<Uint8Array> {
        if (!input) {
            throw new Error('Input is null');
        }
        if (
            typeof window !== 'undefined' &&
            typeof window.crypto !== 'undefined'
        ) {
            // Browser environment
            return HashService._webCryptoHash('SHA-3-256', input);
        } else {
            // Node.js environment
            return HashService._nodeCryptoHash('sha3-256', input);
        }
    }

    static async hash256Multiple(
        input1: Uint8Array | ArrayBuffer,
        input2: Uint8Array | ArrayBuffer
    ): Promise<Uint8Array> {
        if (
            typeof window !== 'undefined' &&
            typeof window.crypto !== 'undefined'
        ) {
            // Browser environment
            return HashService._webCryptoHashMultiple(
                'SHA-3-256',
                input1,
                input2
            );
        } else {
            // Node.js environment
            return HashService._nodeCryptoHashMultiple(
                'sha3-256',
                input1,
                input2
            );
        }
    }

    static hashTransaction(transaction: Uint8Array): Uint8Array {
        return keccak_256(transaction);
    }

    private static async _webCryptoHash(
        algorithm: string,
        input: Uint8Array | ArrayBuffer
    ): Promise<Uint8Array> {
        const buffer = input instanceof ArrayBuffer ? input : input.buffer;
        const hashBuffer = await window.crypto.subtle.digest(algorithm, buffer);
        return new Uint8Array(hashBuffer);
    }

    private static async _webCryptoHashMultiple(
        algorithm: string,
        input1: Uint8Array | ArrayBuffer,
        input2: Uint8Array | ArrayBuffer
    ): Promise<Uint8Array> {
        const buffer1 = input1 instanceof ArrayBuffer ? input1 : input1.buffer;
        const buffer2 = input2 instanceof ArrayBuffer ? input2 : input2.buffer;
        const combinedBuffer = new Uint8Array(
            buffer1.byteLength + buffer2.byteLength
        );
        combinedBuffer.set(new Uint8Array(buffer1), 0);
        combinedBuffer.set(new Uint8Array(buffer2), buffer1.byteLength);

        const hashBuffer = await window.crypto.subtle.digest(
            algorithm,
            combinedBuffer.buffer
        );
        return new Uint8Array(hashBuffer);
    }

    private static _nodeCryptoHash(
        algorithm: string,
        input: Uint8Array | ArrayBuffer
    ): Uint8Array {
        const crypto = require('crypto');
        const hash = crypto.createHash(algorithm);
        hash.update(input);
        return hash.digest();
    }

    private static _nodeCryptoHashMultiple(
        algorithm: string,
        input1: Uint8Array | ArrayBuffer,
        input2: Uint8Array | ArrayBuffer
    ): Uint8Array {
        const crypto = require('crypto');
        const hash = crypto.createHash(algorithm);
        hash.update(input1);
        hash.update(input2);
        return hash.digest();
    }
}
