import axios from 'axios';
import WalletUtils from '../wallet.utils';
import BigNumber from 'bignumber.js';
import { BnToBytes, decToBytes } from '../utils';
import { keccak256 } from 'js-sha3';

// @ts-ignore
import * as secp256k1 from 'secp256k1';

const url = 'https://pwrexplorerbackend.pwrlabs.io';

function generateTxnBytes(
    id: number,
    nonce: number,
    amount: string,
    recipientSr: string
) {
    // random uint32

    const idDec = id;
    const nonceDec = Math.floor(Math.random() * 2 ** 32);
    const amountBN = BigNumber(amount).shiftedBy(9);
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

export default class PwrWallet {
    #_address: string;
    #_privateKey: string;

    // *~~*~~*~~ getters ~~*~~*~~* //

    get address(): string {
        return this.#_address;
    }

    // random
    constructor(privateKey: string) {
        const wallet = WalletUtils.fromPrivateKey(privateKey);

        this.#_address = wallet.getAddressString();
        this.#_privateKey = wallet.getPrivateKeyString();
    }

    async getBalance() {
        const res = await axios({
            method: 'get',
            url: `${url}/balanceOf/?userAddress=${this.#_address}`,
        });

        if (res.data.status !== 'success') {
            throw new Error('Error getting balance');
        }

        return res.data.data.balance;
    }

    async getTransactions() {
        const res = await axios({
            method: 'get',
            url: `${url}/transactionHistory/?address=${this.#_address}`,
        });

        if (res.data.status !== 'success') {
            throw new Error('Error getting transactions');
        }

        return res.data.data.txns;
    }

    async sendTransaction(recipient: string, amount: string) {
        const id = 0;

        const randomNonce = Math.floor(Math.random() * 2 ** 32);

        const txnDataBytes = generateTxnBytes(
            id,
            randomNonce,
            amount,
            recipient
        );

        const signedTxnBytes = signTxn(txnDataBytes, this.#_privateKey);

        const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
        // const txnHex = Buffer.from(txnBytes).toString('hex');

        const hashedTxnFinal = hashTxn(txnBytes);
        const hashedTxnStr = Buffer.from(hashedTxnFinal).toString('hex');

        const res = await axios({
            method: 'post',
            url: `${url}/broadcast/`,
            data: {
                txn: hashedTxnStr,
            },
        });

        if (res.data.status !== 'success') {
            throw new Error('Error sending transaction');
        }

        return res.data.data;
    }
}
