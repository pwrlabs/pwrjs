import { FalconKeyPair } from './falcon/c';

export default class BytesService {
    public static keypairToArrayBuffer(keypair: FalconKeyPair): Uint8Array {
        const { pk, sk } = keypair;

        const pkLengthBuffer = new Uint8Array(4);
        new DataView(pkLengthBuffer.buffer).setUint32(0, pk.length, false);

        const skLengthBuffer = new Uint8Array(4);
        new DataView(skLengthBuffer.buffer).setUint32(0, sk.length, false);

        const buffer = new Uint8Array(4 + pk.length + 4 + sk.length);

        let offset = 0;

        buffer.set(pkLengthBuffer, offset);
        offset += 4;
        buffer.set(pk, offset);
        offset += pk.length;
        buffer.set(skLengthBuffer, offset);
        offset += 4;
        buffer.set(sk, offset);

        return buffer;
    }

    public static arrayBufferToKeypair(buffer: Uint8Array): FalconKeyPair {
        const view = new DataView(buffer.buffer);
        let offset = 0;

        // Read public key length
        const pkLength = view.getUint32(offset, false);
        offset += 4;

        // Read public key
        const pk = new Uint8Array(buffer.slice(offset, offset + pkLength));
        offset += pkLength;

        // Read private key length
        const skLength = view.getUint32(offset, false);
        offset += 4;

        // Read private key
        const sk = new Uint8Array(buffer.slice(offset, offset + skLength));

        return { pk, sk };
    }
}
