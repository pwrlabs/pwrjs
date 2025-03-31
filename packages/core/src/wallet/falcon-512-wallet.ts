// 3rd party
import { bytesToHex } from '@noble/hashes/utils';

// protocol
import PWRJS from '../protocol/pwrjs';

// services
import HttpService from '../services/http.service';
import HashService from '../services/hash.service';
import StorageService from '../services/storage.service';

// utils
import { TransactionResponse } from './wallet.types';
import TransactionBuilder from '../protocol/transaction-builder';
import { FalconKeyPair } from '../services/falcon/c';
import BytesService from '../services/bytes.service';
import CryptoService from '../services/crypto.service';
import { Falcon } from '../services/falcon.service';

export default class Falcon512Wallet {
    public _addressHex: string;
    private _addressBytes: Uint8Array;
    private _publicKey: Uint8Array;
    private _privateKey: Uint8Array;

    private keypair: FalconKeyPair;

    // services and objects
    private s_httpSvc = new HttpService('https://pwrrpc.pwrlabs.io');
    private pwrjs = new PWRJS('https://pwrrpc.pwrlabs.io');

    // #region instantiate

    constructor(
        publicKey: Uint8Array,
        privateKey: Uint8Array
    ) {
        this._publicKey = publicKey;
        this._privateKey = privateKey;

        const hash = HashService.kekak224(publicKey);
        const address = hash.slice(0, 20);
        this._addressBytes = address;
        this._addressHex = '0x' + bytesToHex(address);
    }

    getChainId() {
        return this.pwrjs.getChainId();
    }

    static async new(pwr: PWRJS): Promise<Falcon512Wallet> {
        if (typeof window === 'undefined') {
            // node
            const { pk, sk } = await Falcon.generateKeypair512();
            return new Falcon512Wallet(pk, sk);
        } else {
            // browser
            const m = await import('../services/falcon/falcon-browser.service');
            const { pk, sk } = await m.default.generateKeyPair();
            return new Falcon512Wallet(pk, sk);
        }
    }

    static fromKeys(
        publicKey: Uint8Array,
        privateKey: Uint8Array
    ): Falcon512Wallet {
        return new Falcon512Wallet(publicKey, privateKey);
    }

    // #endregion

    async getNonce(): Promise<number> {
        const res = await this.s_httpSvc.get<{ nonce: number }>(
            `/nonceOfUser/?userAddress=${this._addressHex}`
        );

        return res.nonce;
    }

    // remove
    getKeyPair(): FalconKeyPair {
        return this.keypair;
    }

    getAddress(): string {
        return this._addressHex;
    }

    getPublicKey(): Uint8Array {
        return this._publicKey;
    }

    getPrivateKey(): Uint8Array {
        return this._privateKey;
    }

    async getBalance(): Promise<string> {
        const res = await this.pwrjs.getBalanceOfAddress(this._addressHex);
        return res;
    }

    async sign(data: Uint8Array): Promise<Uint8Array> {
        if (typeof window === 'undefined') {
            // node
            return await Falcon.sign512(data, this._privateKey);
        } else {
            // browser
            const m = await import('../services/falcon/falcon-browser.service');
            return m.default.sign(data, this._privateKey);
        }
    }

    async getSignedTransaction(transaction: Uint8Array): Promise<Uint8Array> {
        const signature = await this.sign(transaction);

        const buffer = new ArrayBuffer(
            2 + signature.length + transaction.length
        );
        const view = new DataView(buffer);

        // copy txn
        new Uint8Array(buffer).set(transaction);

        view.setInt16(transaction.length, signature.length);

        new Uint8Array(buffer, transaction.length + 2).set(signature);

        return new Uint8Array(buffer);
    }

    async verifySignature(
        message: Uint8Array,
        signature: Uint8Array
    ): Promise<boolean> {
        return await Falcon.verify512(message, signature, this._publicKey);
    }

    async setPublicKey(publicKey: Uint8Array): Promise<TransactionResponse>;
    // prettier-ignore
    async setPublicKey(publicKey: Uint8Array, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async setPublicKey(publicKey: Uint8Array, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = this.getChainId();
        const txn = TransactionBuilder.getFalconSetPublicKeyTransaction(
            publicKey,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        const res = await this.signAndSend(txn);
        return res;
    }

    async joinAsValidator(ip: string): Promise<TransactionResponse>;
    // prettier-ignore
    async joinAsValidator(ip: string, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async joinAsValidator(ip: string, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = this.getChainId();
        const txn = TransactionBuilder.getFalconJoinAsValidatorTransaction(
            ip,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        const res = await this.signAndSend(txn);
        return res;
    }

    async delegate(validator: string, pwrAmount: string): Promise<TransactionResponse>;
    // prettier-ignore
    async delegate(validator: string, pwrAmount: string, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async delegate(validator: string, pwrAmount: string, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
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
            this._addressBytes,
            _feePerByte.toString()
        );

        const res = await this.signAndSend(txn);
        return res;
    }

    async changeIp(newIp: string): Promise<TransactionResponse>;
    // prettier-ignore
    async changeIp(newIp: string, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async changeIp(newIp: string, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = this.getChainId();
        const txn = TransactionBuilder.getFalconChangeIpTransaction(
            newIp,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        const res = await this.signAndSend(txn);
        return res;
    }

    async claimActiveNodeSpot(): Promise<TransactionResponse>;
    // prettier-ignore
    async claimActiveNodeSpot(nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async claimActiveNodeSpot(nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = this.getChainId();
        const txn = TransactionBuilder.getFalconClaimActiveNodeSpotTransaction(
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        const res = await this.signAndSend(txn);
        return res;
    }

    async transferPWR(to: string, amount: string): Promise<TransactionResponse>;
    // prettier-ignore
    async transferPWR(to: string, amount: string, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async transferPWR(to: string, amount: string, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
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
            this._addressBytes,
            _feePerByte.toString()
        );

        const res = await this.signAndSend(txn);
        return res;
    }

    async sendVmData(vmId: string, data: Uint8Array): Promise<TransactionResponse>;
    // prettier-ignore
    async sendVmData(vmId: string, data: Uint8Array, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async sendVmData(vmId: string, data: Uint8Array, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
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
            this._addressBytes,
            _feePerByte.toString()
        );

        const res = await this.signAndSend(txn);
        return res;
    }

    async storeWallet(filePath: string): Promise<boolean> {
        try {
            if (typeof window === 'undefined') {
                let buffer = Buffer.alloc(0);

                const pubLengthBuffer = Buffer.alloc(4);
                pubLengthBuffer.writeUInt32BE(this._publicKey.length, 0);
                buffer = Buffer.concat([buffer, pubLengthBuffer, Buffer.from(this._publicKey)]);

                const privLengthBuffer = Buffer.alloc(4);
                privLengthBuffer.writeUInt32BE(this._privateKey.length, 0);
                buffer = Buffer.concat([buffer, privLengthBuffer, Buffer.from(this._privateKey)]);

                const { writeFile } = require('fs/promises') as typeof import('fs/promises');

                await writeFile(filePath, buffer);
                return true;
            } else {
                throw new Error('This method cannot be called on the client-side (browser)');
            }
        } catch (error) {
            throw new Error(`Failed to store wallet: ${error.message}`);
        }
    }

    static async loadWalletNode(filePath: string): Promise<Falcon512Wallet> {
        try {
            if (typeof window === 'undefined') {
                const { readFile } = require('fs/promises') as typeof import('fs/promises');

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
            } else {
                throw new Error('This method cannot be called on the client-side (browser)');
            }
        } catch (error) {
            throw new Error(`Failed to load wallet: ${error.message}`);
        }
    }

    static async loadWalletBrowser(pwr: PWRJS, password: string, file: File) {
        if (typeof window === 'undefined') {
            throw new Error(
                'This method is meant for browser environment, please use loadWallet instead'
            );
        }

        try {
            const bytes = await StorageService.loadBrowser(file);

            const decrypted: Uint8Array =
                await CryptoService.decryptPrivateKeyBrowser(bytes, password);

            const { pk, sk } = BytesService.arrayBufferToKeypair(decrypted);

            return new Falcon512Wallet(pk, sk);
        } catch (e) {
            console.error(e);
            throw new Error('Failed to load wallet');
        }
    }

    // #endregion

    // #region verifies
    private async makeSurePublicKeyIsSet(): Promise<TransactionResponse | null> {
        const nonce = await this.getNonce();

        if (nonce == 0) {
            let tx = this.setPublicKey(this._publicKey);
            return tx;
        } else {
            return null;
        }
    }

    // #endregion

    // #region utils

    private async signAndSend(
        transaction: Uint8Array
    ): Promise<TransactionResponse> {
        const signedTransaction = await this.getSignedTransaction(transaction);
        const txnHex = bytesToHex(signedTransaction);
        const txnHash = bytesToHex(
            HashService.hashTransaction(signedTransaction)
        );

        const res = await this.s_httpSvc.broadcastTxn(
            this.pwrjs.getRpcNodeUrl(),
            txnHex,
            txnHash
        );

        return res;
    }
    // #endregion
}
