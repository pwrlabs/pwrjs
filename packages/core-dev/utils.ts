import { hexToBytes as oHexToBytes, bytesToHex as oBytesToHex } from '@noble/hashes/utils';

// Helper: dynamically sized bigint to byte array
export function bigintToBytesDynamic(value: bigint): Uint8Array {
    const hex = value.toString(16);
    const paddedHex = hex.length % 2 === 0 ? hex : '0' + hex;
    const bytes = new Uint8Array(paddedHex.length / 2);

    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(paddedHex.substr(i * 2, 2), 16);
    }

    return bytes;
}

export function hexToBytes(hex: string): Uint8Array {
    // Check if the hex string starts with '0x' and remove it if necessary
    const hexString = hex.startsWith('0x') ? hex.slice(2) : hex;

    // Convert the hex string to a byte array
    return oHexToBytes(hexString);
}

export function bytesToHex(bytes: Uint8Array): string {
    // Convert the byte array to a hex string
    return oBytesToHex(bytes);
}
