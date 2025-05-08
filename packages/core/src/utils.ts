import { hexToBytes as oHexToBytes, bytesToHex as oBytesToHex } from '@noble/hashes/utils';

// import BigNumber from 'bignumber.js';

// // export function decodeHex(hex: string): Uint8Array {
// //     const bytes = new Uint8Array(hex.length / 2);
// //     for (let i = 0; i < hex.length; i += 2) {
// //         bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
// //     }
// //     return bytes;
// // }

// // export function HexToBytes(hex: string): Uint8Array {
// //     const hexString = hex.startsWith('0x') ? hex.slice(2) : hex;
// //     const byteArray = new Uint8Array(hexString.length / 2);
// //     for (let i = 0, j = 0; i < hexString.length; j++, i += 2) {
// //         byteArray[j] = parseInt(hexString.substring(i, i + 2), 16);
// //     }
// //     return byteArray;
// // }

// export function bytesToHex(val: Uint8Array) {
//     return val.reduce((acc, curr) => acc + curr.toString(16).padStart(2, '0'), '');
// }

// // Helper: dynamically sized bigint to byte array
export function bigintToBytesDynamic(value: bigint): Uint8Array {
    const hex = value.toString(16);
    const paddedHex = hex.length % 2 === 0 ? hex : '0' + hex;
    const bytes = new Uint8Array(paddedHex.length / 2);

    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(paddedHex.substr(i * 2, 2), 16);
    }

    return bytes;
}

// export function decToBytes2(decimalNumber, numberOfBytes) {
//     let bigIntNum = BigInt(decimalNumber); // Convert number to BigInt
//     let bytes = new Uint8Array(numberOfBytes);

//     // Fill bytes array with bigIntNum from the last position to the first
//     for (let i = numberOfBytes - 1; i >= 0; i--) {
//         bytes[i] = Number(bigIntNum & BigInt(0xff)); // Apply mask for the lowest 8 bits and convert to Number
//         bigIntNum >>= BigInt(8); // Right shift by 8 bits
//     }

//     return bytes;
// }

export function decToBytes(decimalNumber: number, numberOfBytes: number) {
    // Create a Uint8Array of the specified size
    let bytes = new Uint8Array(numberOfBytes);

    // Start filling from the last position of the array
    for (let i = bytes.length - 1; i >= 0; i--) {
        bytes[i] = decimalNumber & 0xff; // Get the least significant byte
        decimalNumber >>= 8; // Right shift by 8 bits to move to the next byte
    }

    return bytes;
}

// export function BnToBytes(BN: BigNumber) {
//     const buffer = new ArrayBuffer(8);
//     const view = new DataView(buffer);
//     view.setUint32(0, BN.dividedToIntegerBy(0x100000000).toNumber(), false);
//     view.setUint32(4, BN.mod(0x100000000).toNumber(), false);
//     const bytes = new Uint8Array(buffer);
//     return bytes;
// }

// export function BnToDecimal(val: string, decimmals: number) {
//     const bn = BigNumber(val);

//     const r = bn.shiftedBy(-decimmals).toFixed(2);

//     return r;
// }

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
