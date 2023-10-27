import BigNumber from 'bignumber.js';
export declare function bytesToHex(val: Uint8Array): string;
export declare function decToBytes(decimalNumber: number, numberOfBytes: number): Uint8Array;
export declare function BnToBytes(BN: BigNumber): Uint8Array;
export declare function BnToDecimal(val: string, decimmals: number): string;
export declare function copyToClipboard(text: string): Promise<void>;
export declare function shortenAddress(address: string): string;
export declare function timestampToDate(timestamp: any): string;
