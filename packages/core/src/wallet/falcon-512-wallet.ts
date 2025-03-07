// 3rd party

// protocol
import PWRJS from '../protocol/pwrjs';
import { hexToBytes } from '@noble/hashes/utils';

// services
import HttpService from '../services/http.service';
import FalconServiceBrowser from '../services/falcon/falcon-browser.service';
import FalconServiceNode from '../services/falcon/falcon-node.service';

// utils
import HashService from '../services/hash.service';
import { bytesToHex, HexToBytes } from '../utils';
import { TransactionResponse } from './wallet.types';
import TransactionBuilder from '../protocol/transaction-builder';

import { FalconKeyPair, IFalconService } from '../services/falcon/c';

// not typed due to 3rd party library (algorythm is relatively new and doesn't have much documentation )
export default class PWRFaconl512Wallet {
    public _addressHex: string;
    private _addressBytes: Uint8Array;

    private chainId: number = 0;

    private keypair: FalconKeyPair;

    private s_httpSvc = new HttpService('https://pwrrpc.pwrlabs.io');

    private pwr: PWRJS;

    private _seed?: Uint8Array;

    private falcon: IFalconService;

    constructor(pwr: PWRJS, keypair?: FalconKeyPair) {
        // this.keypair = Falcon512.genkey();
        // console.log('keypair', this.keypair);
        // const publickey = this.keypair.pk;
        this.s_httpSvc = new HttpService('https://pwrrpc.pwrlabs.io');

        const isBrowser = typeof window !== 'undefined';

        this.falcon = isBrowser
            ? new FalconServiceBrowser(null)
            : new FalconServiceNode();

        this.pwr = pwr;

        if (keypair) {
            this.keypair = keypair;
        }
    }

    async init() {
        if (!this.keypair) {
            this.keypair = await this.falcon.generateKeyPair();
        }

        const pubk = this.keypair.pk.H;

        const hash = await HashService.hash224(Buffer.from(pubk, 'hex'));

        this._addressBytes = hash.slice(0, 20);
        this._addressHex = '0x' + bytesToHex(this._addressBytes);
    }

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
        return hexToBytes(this.keypair.pk.H);
    }

    async sign(data: Uint8Array): Promise<Uint8Array> {
        const signature = await this.falcon.sign(
            data,
            this.keypair.pk,
            this.keypair.sk
        );
        return hexToBytes(signature);
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
            Buffer.from(this.keypair.pk.H, 'hex'),
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

        const txnHex = Buffer.from(signedTransaction).toString('hex');
        const txnHash = Buffer.from(
            HashService.hashTransaction(signedTransaction)
        ).toString('hex');

        const res = await this.s_httpSvc.broadcastTxn(
            this.pwr.getRpcNodeUrl(),
            txnHex,
            txnHash
        );

        return res;
    }

    // #endregion
}
