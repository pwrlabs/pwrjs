import { falconKeypair, sign, verify } from 'rust-falcon';

export type FalconKeyPair = {
    pk: Uint8Array;
    sk: Uint8Array;
};

// export abstract class FalconService {
//     /**
//      * Generate a new key pair
//      * @returns {Promise<FalconKeyPair>}
//      */
//     public static generateKeyPair(): Promise<FalconKeyPair> {
//         throw new Error('Method should be override in subclass.');
//     }

//     /**
//      * Sign a message
//      * @param {Uint8Array} message
//      * @param {FalconPublicKey} pk
//      * @param {FalconPrivateKey} sk
//      * @returns {Promise<string>} signature
//      *
//      */
//     // prettier-ignore
//     public static sign(message: Uint8Array, sk: Uint8Array): Promise<Uint8Array> {
//         throw new Error('Method should be override in subclass');
//     }

//     /**
//      * Verify a signature
//      * @param {Uint8Array} string
//      * @param {string} signature
//      * @param {FalconPublicKey} pk
//      * @returns {Promise<boolean>} valid
//      */
//     // prettier-ignore
//     public static verify(message: Uint8Array, pk: Uint8Array, signature: Uint8Array): Promise<boolean> {
//         throw new Error('Method should be override in subclass');
//     }
// }

export default class FalconService {
    static async generateKeyPair(): Promise<FalconKeyPair> {
        const randomBytes = crypto.getRandomValues(new Uint8Array(48));
        const { public: pk, secret: sk } = falconKeypair(randomBytes);
        return { pk, sk };
    }

    static async sign(message: Uint8Array, sk: Uint8Array): Promise<Uint8Array> {
        // const zeroSeed = new Uint8Array(48).fill(0);
        const randomSeed = crypto.getRandomValues(new Uint8Array(48));
        const signature = sign(message, sk, randomSeed);
        return signature.sign;
    }

    // prettier-ignore
    static async verify(message: Uint8Array, pk: Uint8Array, signature: Uint8Array): Promise<boolean> {
        return verify(signature, message, pk);;
    }
}
