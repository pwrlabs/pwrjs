import BigNumber from 'bignumber.js';

export function bytesToHex(val: Uint8Array) {
    return val.reduce(
        (acc, curr) => acc + curr.toString(16).padStart(2, '0'),
        ''
    );
}

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

export function BnToBytes(BN: BigNumber) {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setUint32(0, BN.dividedToIntegerBy(0x100000000).toNumber(), false);
    view.setUint32(4, BN.mod(0x100000000).toNumber(), false);
    const bytes = new Uint8Array(buffer);
    return bytes;
}

export function BnToDecimal(val: string, decimmals: number) {
    const bn = BigNumber(val);

    const r = bn.shiftedBy(-decimmals).toFixed(2);

    return r;
}

export function copyToClipboard(text: string) {
    return navigator.clipboard.writeText(text);
}

export function shortenAddress(address: string): string {
    const beginning = address.substring(0, 4);
    const end = address.substring(address.length - 6);
    return `${beginning}...${end}`;
}

export function timestampToDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    const hour = date.getHours() % 12 || 12;
    const minute = date.getMinutes().toString().padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    return `${month} ${day}, ${year} at ${hour}:${minute} ${ampm}`;
}
