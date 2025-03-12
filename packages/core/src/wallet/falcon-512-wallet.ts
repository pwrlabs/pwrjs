// 3rd party

// protocol
import PWRJS from '../protocol/pwrjs';
import { bytesToHex } from '@noble/hashes/utils';

// services
import HttpService from '../services/http.service';
import FalconServiceNode from '../services/falcon/falcon-node.service';
// import FalconServiceBrowser from '../services/falcon/falcon-browser.service';

// utils
import HashService from '../services/hash.service';
import { TransactionResponse } from './wallet.types';
import TransactionBuilder from '../protocol/transaction-builder';

import { FalconKeyPair } from '../services/falcon/c';

// not typed due to 3rd party library (algorythm is relatively new and doesn't have much documentation )
export default class PWRFaconl512Wallet {
    public _addressHex: string;
    private _addressBytes: Uint8Array;
    private _publicKey: Uint8Array;
    private _privateKey: Uint8Array;

    private chainId: number = 0;

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
    }

    static async new(pwr: PWRJS): Promise<PWRFaconl512Wallet> {
        if (typeof window === 'undefined') {
            const { pk, sk } = await FalconServiceNode.generateKeyPair();
            return new PWRFaconl512Wallet(pwr, pk, sk);
        } else {
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
            return FalconServiceNode.sign(data, this._privateKey);
        } else {
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

    // #region basic transactions
    // prettier-ignore
    public async setPublicKey(feePerByte?: string): Promise<TransactionResponse> {

        let _feePerByte;

        if(!feePerByte){
            const res = await this.pwr.getFeePerByte();
            _feePerByte = BigInt(res);
        }else {
            _feePerByte = BigInt(_feePerByte);
        }

        const nonce = await this.getNonce();

        const raw_transaction = TransactionBuilder.getSetPublicKeyTransaction(
            _feePerByte,
            this._publicKey,
            this._addressBytes,
            nonce,
            this.chainId
        );

        const res = await this.signAndSend(raw_transaction);

        return res;
        
    }

    // prettier-ignore
    async transferPWR(receiver: Uint8Array, amount: string,  feePerByte?: string): Promise<TransactionResponse>{
        await this.verifyPublicKeyIsSet();

        let _feePerByte: bigint;

        if(!feePerByte){
            const res = await this.pwr.getFeePerByte();
            _feePerByte = BigInt(res);
        }else {
            _feePerByte = BigInt(feePerByte);
        }

        const nonce = await this.getNonce();


        const raw_transaction = TransactionBuilder.getFalconTransferTransaction(
            _feePerByte,
            this._addressBytes,
            receiver,
            BigInt(amount),
            nonce,
            this.chainId
        )

        const res = await this.signAndSend(raw_transaction);

        return res;
    }

    // #endregion

    // #region wallet export / import

    // #endregion

    // #region verifies

    private async verifyPublicKeyIsSet(): Promise<void> {
        const res = await this.pwr.getNonceOfAddress(this._addressHex);
        if (res === '0') {
            throw new Error('Public key is not set');
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
