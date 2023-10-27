export default class PwrWallet {
    private address;
    private privateKey;
    constructor(privateKey: string);
    getAddress(): string;
    getBalance(): Promise<any>;
    getNonce(): Promise<any>;
    getPrivateKey(): string;
    transferPWR(to: string, amount: string, nonce?: number): Promise<any>;
    sendVMDataTxn(vmId: string, dataBytes: Uint8Array, nonce?: number): Promise<any>;
}
