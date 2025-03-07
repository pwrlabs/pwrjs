export enum COMMAND {
    GENKEY = 'gen',
    SIGN = 'sign',
    VERIFY = 'verify',
}

export type FalconJar = {
    processCommand: (args: string[]) => Promise<string>;
};

export type FalconPublicKey = {
    H: string;
};

export type FalconPrivateKey = {
    f: string;
    F: string;
    G: string;
};

export type FalconKeyPair = {
    pk: FalconPublicKey;
    sk: FalconPrivateKey;
};

export type KeyPairResponse = {
    f: string;
    F: string;
    G: string;
    H: string;
};

export type SignatureResponse = {
    signature: string;
};

export interface IFalconService {
    /**
     * Generate a new key pair
     * @returns {Promise<FalconKeyPair>}
     */
    generateKeyPair(): Promise<FalconKeyPair>;

    /**
     * Sign a message
     * @param {Uint8Array} message
     * @param {FalconPublicKey} pk
     * @param {FalconPrivateKey} sk
     * @returns {Promise<string>} signature
     *
     */
    sign(
        message: Uint8Array,
        pk: FalconPublicKey,
        sk: FalconPrivateKey
    ): Promise<string>;

    /**
     * Verify a signature
     * @param {Uint8Array} string
     * @param {string} signature
     * @param {FalconPublicKey} pk
     * @returns {Promise<boolean>} valid
     */
    verify(
        message: Uint8Array,
        pk: FalconPublicKey,
        signature: string
    ): Promise<boolean>;
}
