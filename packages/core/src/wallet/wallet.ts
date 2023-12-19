import axios from 'axios';
import WalletUtils from '../wallet.utils';
import BigNumber from 'bignumber.js';
import { BnToBytes, bytesToHex, decToBytes } from '../utils';
import { keccak256 } from 'js-sha3';

import * as secp256k1 from 'secp256k1';

const url = 'https://pwrrpc.pwrlabs.io';

enum Transaction {
    TRANSFER = 0,
    DELEGATE = 3,
    WITHDRAW = 4,
    VM_DATA_TXN = 5,
    CLAIM = 6,
}

function generateClaimTxnBytes(id: number, nonce: number, vmId: string) {
    const idDec = id;
    const nonceDec = nonce;
    const vmIdBN = BigNumber(vmId);
    // const dataHex = data.replace('0x', '');

    const idByte = decToBytes(idDec, 1);
    const nonceByte = decToBytes(nonceDec, 4);
    const vmIdByte = BnToBytes(vmIdBN);

    const txnBytes = new Uint8Array([...idByte, ...nonceByte, ...vmIdByte]);

    return txnBytes;
}

function generateDataTxnBytes(
    id: number,
    nonce: number,
    vmId: string,
    data: string
) {
    const idDec = id;
    const nonceDec = nonce;
    const vmIdBN = BigNumber(vmId);
    // const dataHex = data.replace('0x', '');

    const idByte = decToBytes(idDec, 1);
    const nonceByte = decToBytes(nonceDec, 4);
    const vmIdByte = BnToBytes(vmIdBN);
    const dataByte = new Uint8Array(Buffer.from(data, 'hex'));

    const txnBytes = new Uint8Array([
        ...idByte,
        ...nonceByte,
        ...vmIdByte,
        ...dataByte,
    ]);

    return txnBytes;
}

function generateTxnBytes(
    id: number,
    nonce: number,
    amount: string,
    recipientSr: string
) {
    // random uint32

    const idDec = id;
    const nonceDec = nonce;
    const amountBN = BigNumber(amount); /*.shiftedBy(9);*/
    const recipient = recipientSr.replace('0x', '');
    // const recipient = values.recipientAddress.replace('0x', '');

    const idByte = decToBytes(idDec, 1);
    const nonceByte = decToBytes(nonceDec, 4);
    const amountByte = BnToBytes(amountBN);
    const recipientByte = new Uint8Array(Buffer.from(recipient, 'hex'));

    const txnBytes = new Uint8Array([
        ...idByte,
        ...nonceByte,
        ...amountByte,
        ...recipientByte,
    ]);

    return txnBytes;
}

function hashTxn(txnBytes: Uint8Array): ArrayBuffer {
    const hashedTxn = keccak256.arrayBuffer(txnBytes);
    return hashedTxn;
}

function signTxn(txnBytes: Uint8Array, privateKey: string) {
    const hashedBytes = keccak256.arrayBuffer(txnBytes);

    const privateKeyBytes = new Uint8Array(
        Buffer.from(privateKey.slice(2), 'hex')
    );

    const signObj = secp256k1.ecdsaSign(
        new Uint8Array(hashedBytes),
        privateKeyBytes
    );

    const signature = Buffer.concat([
        signObj.signature,
        Buffer.from([signObj.recid + 27]),
    ]);

    return signature;
}

export default class PWRWallet {
    private address: string;
    private privateKey: string;

    constructor(privateKey?: string) {
        let wallet;

        if (privateKey) {
            wallet = WalletUtils.fromPrivateKey(privateKey);
        } else {
            wallet = WalletUtils.getRandomWallet();
        }

        // this.#_address = wallet.getAddressString();
        this.privateKey = wallet.getPrivateKeyString();
        this.address = wallet.getAddressString();
    }

    // *~~*~~*~~ GETTERS *~~*~~*~~ //

    getPublicKey() {
        const wallet = WalletUtils.fromPrivateKey(this.privateKey);

        const publicKey = wallet.getPublicKeyString();

        return publicKey;
    }

    getAddress() {
        const wallet = WalletUtils.fromPrivateKey(this.privateKey);

        const address = wallet.getAddressString();

        return address;
    }

    async getBalance() {
        const res = await axios({
            method: 'get',
            url: `${url}/balanceOf/?userAddress=${this.address}`,
        });

        return res.data.balance;
    }

    async getNonce() {
        const res = await axios({
            method: 'get',
            url: `${url}/nonceOfUser/?userAddress=${this.address}`,
        });

        return res.data.nonce;
    }

    getPrivateKey(): string {
        return this.privateKey;
    }

    // *~~*~~*~~ TRANSACTIONS *~~*~~*~~ //

    async transferPWR(to: string, amount: string, nonce?: number) {
        const id = Transaction.TRANSFER;

        const _nonce = nonce || (await this.getNonce());

        const txnDataBytes = generateTxnBytes(id, _nonce, amount, to);

        const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);

        const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
        const txnHex = Buffer.from(txnBytes).toString('hex');

        // const hashedTxnFinal = hashTxn(txnBytes);

        // const hashedTxnStr = Buffer.from(hashedTxnFinal).toString('hex');

        const res = await axios({
            method: 'post',
            url: `${url}/broadcast/`,
            data: {
                txn: txnHex,
            },
        });

        return res.data;
    }

    async sendVMDataTxn(vmId: string, dataBytes: Uint8Array, nonce?: number) {
        const id = Transaction.VM_DATA_TXN;

        const _nonce = nonce || (await this.getNonce());

        const _vmId = vmId;

        const data = bytesToHex(dataBytes);

        const txnDataBytes = generateDataTxnBytes(id, _nonce, _vmId, data);

        const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);

        const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
        const txnHex = Buffer.from(txnBytes).toString('hex');

        // const hashedTxnFinal = hashTxn(txnBytes);

        // const hashedTxnStr = Buffer.from(hashedTxnFinal).toString('hex');

        const res = await axios({
            method: 'post',
            url: `${url}/broadcast/`,
            data: {
                txn: txnHex,
            },
        });

        return res.data;
    }

    async delegate(to: string, amount: string, nonce?: number) {
        const id = Transaction.DELEGATE;

        const _nonce = nonce || (await this.getNonce());

        const txnDataBytes = generateTxnBytes(id, _nonce, amount, to);

        const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);

        const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
        const txnHex = Buffer.from(txnBytes).toString('hex');

        const res = await axios({
            method: 'post',
            url: `${url}/broadcast/`,
            data: {
                txn: txnHex,
            },
        });

        return res.data;
    }

    async withdraw(from: string, sharesAmount: string, nonce?: number) {
        const id = Transaction.WITHDRAW;

        const _nonce = nonce || (await this.getNonce());

        const txnDataBytes = generateTxnBytes(id, _nonce, sharesAmount, from);

        const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);

        const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
        const txnHex = Buffer.from(txnBytes).toString('hex');

        const res = await axios({
            method: 'post',
            url: `${url}/broadcast/`,
            data: {
                txn: txnHex,
            },
        });

        return res.data;
    }

    async claimVmId(vmId: string, nonce?: number) {
        const id = Transaction.CLAIM;
        const _nonce = nonce || (await this.getNonce());

        const txnDataBytes = generateClaimTxnBytes(id, _nonce, vmId);

        const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);

        const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
        const txnHex = Buffer.from(txnBytes).toString('hex');

        //
        const res = await axios({
            method: 'post',
            url: `${url}/broadcast/`,
            data: {
                txn: txnHex,
            },
        });

        return res.data;
    }
}
