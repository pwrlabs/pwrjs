// import crypto from 'crypto';

import { createHash } from 'crypto';

export default class DeterministicSecureRandom {
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
            const hash = createHash(this.digest);
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

// export default class DeterministicSecureRandom {
//     private seed: Uint8Array;
//     private counter: number;
//     private digestAlgo: AlgorithmIdentifier;

//     constructor(seed: Uint8Array | string, digestAlgo: AlgorithmIdentifier = 'SHA-256') {
//         this.seed = typeof seed === 'string' ? DeterministicSecureRandom.hexToBytes(seed) : seed;
//         this.counter = 0;
//         this.digestAlgo = digestAlgo;
//     }

//     async nextBytes(length: number): Promise<Uint8Array> {
//         const result = new Uint8Array(length);
//         let offset = 0;

//         while (offset < length) {
//             const counterBuffer = new Uint8Array(4);
//             new DataView(counterBuffer.buffer).setUint32(0, this.counter++);

//             const input = DeterministicSecureRandom.concatBytes(this.seed, counterBuffer);
//             const hashedBuffer = await crypto.subtle.digest(this.digestAlgo, input);
//             const hashed = new Uint8Array(hashedBuffer);

//             const toCopy = Math.min(hashed.length, length - offset);
//             result.set(hashed.subarray(0, toCopy), offset);
//             offset += toCopy;
//         }

//         return result;
//     }

//     private static concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
//         const result = new Uint8Array(a.length + b.length);
//         result.set(a);
//         result.set(b, a.length);
//         return result;
//     }

//     private static hexToBytes(hex: string): Uint8Array {
//         if (hex.length % 2 !== 0) throw new Error('Invalid hex string');
//         const bytes = new Uint8Array(hex.length / 2);
//         for (let i = 0; i < hex.length; i += 2) {
//             bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
//         }
//         return bytes;
//     }
// }
