export type FalconKeyPair = {
    pk: Uint8Array;
    sk: Uint8Array;
};

export abstract class FalconService {
    /**
     * Generate a new key pair
     * @returns {Promise<FalconKeyPair>}
     */
    public static generateKeyPair(): Promise<FalconKeyPair> {
        throw new Error('Method should be override in subclass.');
    }

    /**
     * Sign a message
     * @param {Uint8Array} message
     * @param {FalconPublicKey} pk
     * @param {FalconPrivateKey} sk
     * @returns {Promise<string>} signature
     *
     */
    // prettier-ignore
    public static sign(message: Uint8Array, sk: Uint8Array): Promise<Uint8Array> {
        throw new Error('Method should be override in subclass');
    }

    /**
     * Verify a signature
     * @param {Uint8Array} string
     * @param {string} signature
     * @param {FalconPublicKey} pk
     * @returns {Promise<boolean>} valid
     */
    // prettier-ignore
    public static verify(message: Uint8Array, pk: Uint8Array, signature: Uint8Array): Promise<boolean> {
        throw new Error('Method should be override in subclass');
    }
}
