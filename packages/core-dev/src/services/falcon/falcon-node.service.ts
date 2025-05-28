// import { FalconKeyPair, FalconService } from '../falcon-service';
// // import kemBuilder from '@dashlane/pqc-sign-falcon-512-node';
// import { falconKeypair, sign, verify } from 'rust-falcon';

// export default class FalconServiceNode extends FalconService {
//     static async generateKeyPair(): Promise<FalconKeyPair> {
//         const randomBytes = crypto.getRandomValues(new Uint8Array(48));
//         const { public: pk, secret: sk } = falconKeypair(randomBytes);
//         return { pk, sk };
//     }

//     static async sign(message: Uint8Array, sk: Uint8Array): Promise<Uint8Array> {
//         // const zeroSeed = new Uint8Array(48).fill(0);
//         const randomSeed = crypto.getRandomValues(new Uint8Array(48));
//         const signature = sign(message, sk, randomSeed);
//         return signature.sign;
//     }

//     // prettier-ignore
//     static async verify(message: Uint8Array, pk: Uint8Array, signature: Uint8Array): Promise<boolean> {
//         return verify(signature, message, pk);;
//     }
// }
