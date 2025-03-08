import { getKernel } from 'falcon-sign';

export class Falcon {
    private static async getFalcon512() {
        return await getKernel('falcon512_n3_v1');
    }

    private static async getFalcon1024() {
        return await getKernel('falcon1024_n3_v1');
    }

    static async generateKeypair512() {
        const falcon512 = await this.getFalcon512();
        return falcon512.genkey(); // { sk, pk, genKeySeed }
    }

    static async generateKeypair1024() {
        const falcon1024 = await this.getFalcon1024();
        return falcon1024.genkey();
    }

    static async sign512(message: Uint8Array, secretKey: Uint8Array): Promise<Uint8Array> {
        const falcon512 = await this.getFalcon512();
        return falcon512.sign(message, secretKey);
    }

    static async sign1024(message: Uint8Array, secretKey: Uint8Array): Promise<Uint8Array> {
        const falcon1024 = await this.getFalcon1024();
        return falcon1024.sign(message, secretKey);
    }

    static async verify512(message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): Promise<boolean> {
        const falcon512 = await this.getFalcon512();
        return falcon512.verify(signature, message, publicKey);
    }

    static async verify1024(message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): Promise<boolean> {
        const falcon1024 = await this.getFalcon1024();
        return falcon1024.verify(signature, message, publicKey);
    }
}
