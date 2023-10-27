export default class PWR {
    #private;
    static getRpcNodeUrl(): string;
    static getNonceOfAddress(address: string): Promise<string>;
    static getBalanceOfAddress(address: string): Promise<string>;
    static getFeePerByte(): number;
    static updateFeePerByte(feePerByte: number): void;
    static setRpcNodeUrl(rpcNodeUrl: string): void;
    static broadcastTxn(txnBytes: Uint8Array): Promise<any[]>;
}
