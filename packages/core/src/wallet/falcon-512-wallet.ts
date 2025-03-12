// 3rd party
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

// protocol
import PWRJS from '../protocol/pwrjs';

// services
import HttpService from '../services/http.service';
import HashService from '../services/hash.service';

// utils
import { TransactionResponse } from './wallet.types';
import TransactionBuilder from '../protocol/transaction-builder';
import { FalconKeyPair } from '../services/falcon/c';

// not typed due to 3rd party library (algorythm is relatively new and doesn't have much documentation )
export default class PWRFaconl512Wallet {
    public _addressHex: string;
    private _addressBytes: Uint8Array;
    private _publicKey: Uint8Array;
    private _privateKey: Uint8Array;

    private chainId: number;

    private keypair: FalconKeyPair;

    // services and objects
    private s_httpSvc = new HttpService('https://pwrrpc.pwrlabs.io');

    // #region instantiate

    constructor(
        private pwr: PWRJS,
        publicKey: Uint8Array,
        privateKey: Uint8Array
    ) {
        this._publicKey = publicKey;
        this._privateKey = privateKey;

        const hash = HashService.kekak224(publicKey);
        const address = hash.slice(0, 20);
        this._addressBytes = address;
        this._addressHex = '0x' + bytesToHex(address);

        this.chainId = this.pwr.getChainId();
    }

    static async new(pwr: PWRJS): Promise<PWRFaconl512Wallet> {
        if (typeof window === 'undefined') {
            // node
            const m = await import('../services/falcon/falcon-node.service');
            const { pk, sk } = await m.default.generateKeyPair();
            return new PWRFaconl512Wallet(pwr, pk, sk);
        } else {
            // browser
            const m = await import('../services/falcon/falcon-browser.service');
            const { pk, sk } = await m.default.generateKeyPair();
            return new PWRFaconl512Wallet(pwr, pk, sk);
        }
    }

    static fromKeys(
        pwr: PWRJS,
        publicKey: Uint8Array,
        privateKey: Uint8Array
    ): PWRFaconl512Wallet {
        return new PWRFaconl512Wallet(pwr, publicKey, privateKey);
    }

    // #endregion

    private async getNonce(): Promise<number> {
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
        const res = await this.pwr.getBalanceOfAddress(this._addressHex);
        return res;
    }

    async sign(data: Uint8Array): Promise<Uint8Array> {
        if (typeof window === 'undefined') {
            // node
            const m = await import('../services/falcon/falcon-node.service');
            return m.default.sign(data, this._privateKey);
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

    // verifySignature(
    //     signature: Uint8Array,
    //     message: Uint8Array,
    //     publicKey: Uint8Array
    // ): boolean {
    //     return this.falcon.verify(signature, message, publicKey);
    // }

    // #region base transactions
    public async setPublicKey(): Promise<TransactionResponse>;
    // prettier-ignore
    public async setPublicKey(nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    public async setPublicKey(nonce?: number, feePerByte?: string): Promise<TransactionResponse> {

        const _feePerByte = feePerByte ?? (await this.pwr.getFeePerByte());
        const feePerByteBN = BigInt(_feePerByte);
        const _nonce = nonce ?? (await this.getNonce());

        const raw_transaction = TransactionBuilder.getSetPublicKeyTransaction(
            feePerByteBN,
            this._publicKey,
            this._addressBytes,
            _nonce,
            this.chainId
        );

        return this.signAndSend(raw_transaction);
    }

    async transferPWR(to: string, amount: string): Promise<TransactionResponse>;
    // prettier-ignore
    async transferPWR(to: string, amount: string, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async transferPWR(to: string, amount: string, nonce?: number,  feePerByte?: string): Promise<TransactionResponse>{
        await this.verifyPublicKeyIsSet();

        const _nonce = nonce ?? (await this.getNonce());
        let _feePerByte = (feePerByte) ?? (await this.pwr.getFeePerByte());
        const feePerByteBN = BigInt(_feePerByte);

        const raw_transaction = TransactionBuilder.getFalconTransferTransaction(
            feePerByteBN,
            this._addressBytes,
            hexToBytes(to.slice(2)),
            BigInt(amount),
            _nonce,
            this.chainId
        )

        return this.signAndSend(raw_transaction);
    }

    // prettier-ignore
    async sendVmData(vmId: string, data: Uint8Array): Promise<TransactionResponse>;
    // prettier-ignore
    async sendVmData(vmId: string, data: Uint8Array, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async sendVmData(vmId: string, data: Uint8Array, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        await this.verifyPublicKeyIsSet();

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwr.getFeePerByte());
        const feePerByteBN = BigInt(_feePerByte);

        const txn = TransactionBuilder.getFalconVmDataTransaction(
            feePerByteBN,
            this._addressBytes,
            BigInt(vmId),
            data,
            _nonce,
            this.chainId,
        );
        
        return this.signAndSend(txn);
    }

    // #endregion

    // #region wallet export / import

    // #endregion

    // #region verifies

    private async verifyPublicKeyIsSet(): Promise<void> {
        const res = await this.pwr.getNonceOfAddress(this._addressHex);
        if (res === '0') {
            await this.setPublicKey();
        }
    }

    // #endregion

    // #region utils

    private async signAndSend(
        transaction: Uint8Array
    ): Promise<TransactionResponse> {
        // const pkbytes = hexToBytes(this.privateKey);
        const signedTransaction = await this.getSignedTransaction(transaction);
        const txnHex = bytesToHex(signedTransaction);
        const txnHash = bytesToHex(
            HashService.hashTransaction(signedTransaction)
        );

        const res = await this.s_httpSvc.broadcastTxn(
            this.pwr.getRpcNodeUrl(),
            txnHex,
            txnHash
        );

        return res;
    }
    // #endregion
}
