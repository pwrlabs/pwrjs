import { Falcon } from "../services/falcon.service";
import { readFile, writeFile } from "fs/promises";
import { keccak224 } from "js-sha3";
import { sendTxn, TxnRes, hashTxn } from "./wallet";
import PWRJS from "../protocol/pwrjs";
import TransactionBuilder from '../protocol/transaction-builder';
import HttpService from '../services/http.service';

export default class Falcon512Wallet {
    public publicKey: Uint8Array;
    public privateKey: Uint8Array;
    public address: Uint8Array;
    private chainId: number = 0;

    private s_httpSvc = new HttpService('https://pwrrpc.pwrlabs.io');
    private pwrjs = new PWRJS('https://pwrrpc.pwrlabs.io');

    constructor(publicKey: Uint8Array, privateKey: Uint8Array, address: Uint8Array) {
        this.publicKey = publicKey;
        this.privateKey = privateKey;
        this.address = address;
    }

    getChainId() {
        return this.chainId;
    }
    setChainId(chainId: number) {
        this.chainId = chainId;
    }

    static async new(): Promise<Falcon512Wallet> {
        const { pk, sk } = await Falcon.generateKeypair512();
        const hash = this.hash224(pk);
        const address = hash.slice(0, 20);
        return new Falcon512Wallet(pk, sk, address);
    }

    static fromKeys(publicKey: Uint8Array, privateKey: Uint8Array): Falcon512Wallet {
        const hash = this.hash224(publicKey);
        const address = hash.slice(0, 20);
        return new Falcon512Wallet(publicKey, privateKey, address);
    }

    async storeWallet(filePath: string): Promise<boolean> {
        try {
            let buffer = Buffer.alloc(0);

            const pubLengthBuffer = Buffer.alloc(4);
            pubLengthBuffer.writeUInt32BE(this.publicKey.length, 0);
            buffer = Buffer.concat([buffer, pubLengthBuffer, Buffer.from(this.publicKey)]);

            const privLengthBuffer = Buffer.alloc(4);
            privLengthBuffer.writeUInt32BE(this.privateKey.length, 0);
            buffer = Buffer.concat([buffer, privLengthBuffer, Buffer.from(this.privateKey)]);

            await writeFile(filePath, buffer);
            return true;
        } catch (error) {
            throw new Error(`Failed to store wallet: ${error.message}`);
        }
    }

    static async loadWallet(filePath: string): Promise<Falcon512Wallet> {
        try {
            const data = await readFile(filePath);
            if (data.length < 8) throw new Error(`File too small: ${data.length} bytes`);

            let offset = 0;

            const pubLength = data.readUInt32BE(offset);
            offset += 4;
            if (pubLength === 0 || pubLength > 2048) throw new Error(`Invalid public key length: ${pubLength}`);
            if (offset + pubLength > data.length) throw new Error(`File too small for public key of length ${pubLength}`);

            const publicKeyBytes = data.slice(offset, offset + pubLength);
            offset += pubLength;

            if (offset + 4 > data.length) throw new Error("File too small for secret key length");

            const secLength = data.readUInt32BE(offset);
            offset += 4;
            if (secLength === 0 || secLength > 4096) throw new Error(`Invalid secret key length: ${secLength}`);
            if (offset + secLength > data.length) throw new Error(`File too small for secret key of length ${secLength}`);

            const privateKeyBytes = data.slice(offset, offset + secLength);

            return Falcon512Wallet.fromKeys(publicKeyBytes, privateKeyBytes);
        } catch (error) {
            throw new Error(`Failed to load wallet: ${error.message}`);
        }
    }

    getAddress(): string {
        return `0x${Buffer.from(this.address).toString("hex")}`;
    }

    getPublicKey(): Buffer {
        return Buffer.from(this.publicKey);
    }

    getPrivateKey(): Buffer {
        return Buffer.from(this.privateKey);
    }

    async getNonce() {
        const res = await this.s_httpSvc.get<{ nonce: number }>(
            `/nonceOfUser/?userAddress=${this.getAddress()}`
        );

        return res.nonce;
    }

    async getBalance() {
        const res = await this.s_httpSvc.get<{ balance: bigint }>(
            `/balanceOf/?userAddress=${this.getAddress()}`
        );

        return res.balance;
    }

    async sign(message: Uint8Array): Promise<Uint8Array> {
        return await Falcon.sign512(message, this.privateKey);
    }

    async verify(message: Uint8Array, signature: Uint8Array): Promise<boolean> {
        return await Falcon.verify512(message, signature, this.publicKey);
    }

    async setPublicKey(publicKey: Uint8Array): Promise<TxnRes>;
    // prettier-ignore
    async setPublicKey(publicKey: Uint8Array, nonce: number, feePerByte: string): Promise<TxnRes>;
    // prettier-ignore
    async setPublicKey(publicKey: Uint8Array, nonce?: number, feePerByte?: string): Promise<TxnRes> {
        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = this.getChainId();
        const txn = TransactionBuilder.getFalconSetPublicKeyTransaction(
            publicKey,
            _nonce,
            _chainId,
            this.address,
            _feePerByte.toString()
        );

        const res = await this.signAndSend(txn);
        return res;
    }

    async joinAsValidator(ip: string): Promise<TxnRes>;
    // prettier-ignore
    async joinAsValidator(ip: string, nonce: number, feePerByte: string): Promise<TxnRes>;
    // prettier-ignore
    async joinAsValidator(ip: string, nonce?: number, feePerByte?: string): Promise<TxnRes> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = this.getChainId();
        const txn = TransactionBuilder.getFalconJoinAsValidatorTransaction(
            ip,
            _nonce,
            _chainId,
            this.address,
            _feePerByte.toString()
        );

        const res = await this.signAndSend(txn);
        return res;
    }

    async delegate(validator: string, pwrAmount: string): Promise<TxnRes>;
    // prettier-ignore
    async delegate(validator: string, pwrAmount: string, nonce: number, feePerByte: string): Promise<TxnRes>;
    // prettier-ignore
    async delegate(validator: string, pwrAmount: string, nonce?: number, feePerByte?: string): Promise<TxnRes> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = this.getChainId();
        const txn = TransactionBuilder.getFalconDelegateTransaction(
            validator,
            pwrAmount,
            _nonce,
            _chainId,
            this.address,
            _feePerByte.toString()
        );

        const res = await this.signAndSend(txn);
        return res;
    }

    async changeIp(newIp: string): Promise<TxnRes>;
    // prettier-ignore
    async changeIp(newIp: string, nonce: number, feePerByte: string): Promise<TxnRes>;
    // prettier-ignore
    async changeIp(newIp: string, nonce?: number, feePerByte?: string): Promise<TxnRes> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = this.getChainId();
        const txn = TransactionBuilder.getFalconChangeIpTransaction(
            newIp,
            _nonce,
            _chainId,
            this.address,
            _feePerByte.toString()
        );

        const res = await this.signAndSend(txn);
        return res;
    }

    async claimActiveNodeSpot(): Promise<TxnRes>;
    // prettier-ignore
    async claimActiveNodeSpot(nonce: number, feePerByte: string): Promise<TxnRes>;
    // prettier-ignore
    async claimActiveNodeSpot(nonce?: number, feePerByte?: string): Promise<TxnRes> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = this.getChainId();
        const txn = TransactionBuilder.getFalconClaimActiveNodeSpotTransaction(
            _nonce,
            _chainId,
            this.address,
            _feePerByte.toString()
        );

        const res = await this.signAndSend(txn);
        return res;
    }

    async transferPWR(to: string, amount: string): Promise<TxnRes>;
    // prettier-ignore
    async transferPWR(to: string, amount: string, nonce: number, feePerByte: string): Promise<TxnRes>;
    // prettier-ignore
    async transferPWR(to: string, amount: string, nonce?: number, feePerByte?: string): Promise<TxnRes> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = this.getChainId();
        const txn = TransactionBuilder.getFalconTransferPwrTransaction(
            to,
            amount,
            _nonce,
            _chainId,
            this.address,
            _feePerByte.toString()
        );

        const res = await this.signAndSend(txn);
        return res;
    }

    async sendVmData(vmId: string, data: Uint8Array): Promise<TxnRes>;
    // prettier-ignore
    async sendVmData(vmId: string, data: Uint8Array, nonce: number, feePerByte: string): Promise<TxnRes>;
    // prettier-ignore
    async sendVmData(vmId: string, data: Uint8Array, nonce?: number, feePerByte?: string): Promise<TxnRes> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = this.getChainId();
        const txn = TransactionBuilder.getFalconVmDataTransaction(
            vmId,
            data,
            _nonce,
            _chainId,
            this.address,
            _feePerByte.toString()
        );

        const res = await this.signAndSend(txn);
        return res;
    }

    private async makeSurePublicKeyIsSet() {
        const nonce = await this.getNonce();

        if (nonce == 0) {
            let tx = this.setPublicKey(this.publicKey);
            return tx;
        } else {
            return null;
        }
    }


    private async signAndSend(txnDataBytes: Uint8Array): Promise<TxnRes> {
        const signature = await this.sign(txnDataBytes);
        const txnBytes = new Uint8Array([...txnDataBytes, ...signature]);

        const txnHex = Buffer.from(txnBytes).toString('hex');
        const hashedTxnFinal = hashTxn(txnBytes);
        const hashedTxnStr = Buffer.from(hashedTxnFinal).toString('hex');

        const res = await sendTxn(txnHex, hashedTxnStr);

        return res;
    }

    private static hash224(input: Uint8Array): Buffer {
        const hash = keccak224.create();
        hash.update(Buffer.from(input));
        return Buffer.from(hash.digest());
    }
}
