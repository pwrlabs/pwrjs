export type FalconKeyPair = {
    pk: Uint8Array;
    sk: Uint8Array;
};

export abstract class AbstractFalconService {
    static generateKeyPair() {
        throw new Error('Method not implemented.');
    }
    static sign(message: Uint8Array, sk: Uint8Array) {
        throw new Error('Method not implemented.');
    }
    static verify(signature: Uint8Array, message: Uint8Array, pk: Uint8Array) {
        throw new Error('Method not implemented.');
    }
}
