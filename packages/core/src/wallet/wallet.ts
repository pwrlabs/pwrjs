import axios from 'axios';
import WalletUtils from '../wallet.utils';
import BigNumber from 'bignumber.js';
import { BnToBytes, bytesToHex, decToBytes } from '../utils';
import { keccak256, keccak224 } from 'js-sha3';

import * as secp256k1 from 'secp256k1';
import TransactionBuilder from '../protocol/transaction-builder';

const url = 'https://pwrrpc.pwrlabs.io';
const _baseUrl = 'https://pwrexplorerbackend.pwrlabs.io';

enum Transaction {
    TRANSFER = 0,
    JOIN = 1,
    CLAIM_SPOT = 2,
    DELEGATE = 3,
    WITHDRAW = 4,
    VM_DATA_TXN = 5,
    CLAIM_VM_ID = 6,
    REMOVE_VALIDATOR = 7,
    SET_GUARDIAN = 8,
    REMOVE_GUARDIAN = 9,
    SEND_GUARDIAN = 10,
}

function generateClaimTxnBytes(
    id: number,
    chainId: number,
    nonce: number,
    vmId: string
) {
    const chainIdByte = decToBytes(chainId, 1);
    const idDec = id;
    const nonceDec = nonce;
    const vmIdBN = BigNumber(vmId);

    const idByte = decToBytes(idDec, 1);
    const nonceByte = decToBytes(nonceDec, 4);
    const vmIdByte = BnToBytes(vmIdBN);

    const txnBytes = new Uint8Array([
        ...idByte,
        ...chainIdByte,
        ...nonceByte,
        ...vmIdByte,
    ]);

    return txnBytes;
}

function generateDataTxnBytes(
    id: number,
    chainId: number,
    nonce: number,
    vmId: string,
    data: string
) {
    const chainIdByte = decToBytes(chainId, 1);
    const idDec = id;
    const nonceDec = nonce;
    const vmIdBN = BigNumber(vmId);
    const dataByte = new Uint8Array(Buffer.from(data, 'hex'));

    const idByte = decToBytes(idDec, 1);
    const nonceByte = decToBytes(nonceDec, 4);
    const vmIdByte = BnToBytes(vmIdBN);

    const txnBytes = new Uint8Array([
        ...idByte,
        ...chainIdByte,
        ...nonceByte,
        ...vmIdByte,
        ...dataByte,
    ]);

    return txnBytes;
}

function generateTxnBytes(
    id: number,
    chainId: number,
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
    const chainIdByte = decToBytes(chainId, 1);
    const nonceByte = decToBytes(nonceDec, 4);
    const amountByte = BnToBytes(amountBN);
    const recipientByte = new Uint8Array(Buffer.from(recipient, 'hex'));

    const txnBytes = new Uint8Array([
        ...idByte,
        ...chainIdByte,
        ...nonceByte,
        ...amountByte,
        ...recipientByte,
    ]);

    return txnBytes;
}

function hashTxn(txnBytes: Uint8Array): ArrayBuffer {
    const hashedTxn = keccak224.arrayBuffer(txnBytes);
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
    private chainId: number = 0;

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

    calculateTransactionFee(txnBytes: Uint8Array): BigNumber {
        const txnSize = txnBytes.length;
        const feePerByte = new BigNumber(100);
        const txnFeeInUnits = new BigNumber(txnSize).multipliedBy(feePerByte);

        const txnFeeInPWR = txnFeeInUnits.dividedBy(
            new BigNumber(1_000_000_000)
        );

        return txnFeeInPWR;
    }

    async calculateFee(transactionType, params) {
        let txnDataBytes;
        let txnBytes;
        const { amount, to, nonce, vmId, dataBytes } = params;

        switch (transactionType) {
            case Transaction.TRANSFER: {
                const _nonce = nonce || (await this.getNonce());
                const _chainId = this.getChainId();
                txnDataBytes = generateTxnBytes(
                    Transaction.TRANSFER,
                    _chainId,
                    _nonce,
                    amount,
                    to
                );
                break;
            }
            case Transaction.VM_DATA_TXN: {
                const _nonce = nonce || (await this.getNonce());
                if (!(dataBytes instanceof Uint8Array)) {
                    console.error('dataBytes must be a Uint8Array');
                    return new BigNumber(0);
                }
                const dataHex = bytesToHex(dataBytes);
                const _chainId = this.getChainId();
                txnDataBytes = generateDataTxnBytes(
                    Transaction.VM_DATA_TXN,
                    _chainId,
                    _nonce,
                    vmId,
                    dataHex
                );
                break;
            }
            default:
                console.error(
                    'Unsupported transaction type for fee calculation'
                );
                return new BigNumber(0);
        }

        const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);
        txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
        return this.calculateTransactionFee(txnBytes);
    }

    // *~~*~~*~~ TRANSACTIONS *~~*~~*~~ //
    getChainId() {
        return this.chainId;
    }
    setChainId(chainId: number) {
        this.chainId = chainId;
    }

    async transferPWR(to: string, amount: string, nonce?: number) {
        const id = Transaction.TRANSFER;

        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();
        const txn = TransactionBuilder.getTransferPwrTransaction(
            _chainId,
            _nonce,
            amount,
            to
        );

        const signature = signTxn(txn, this.privateKey);

        const txnBytes = new Uint8Array([...txn, ...signature]);

        const txnHex = Buffer.from(txnBytes).toString('hex');
        const hashedTxnFinal = hashTxn(txnBytes);
        const hashedTxnStr = Buffer.from(hashedTxnFinal).toString('hex');

        const txnData = {
            id,
            nonce,
            value: BigNumber(amount).shiftedBy(9).toString(),
            to: to,
            hash: `0x${hashedTxnStr}`,
        };

        const res = await axios({
            method: 'post',
            url: `${url}/broadcast/`,
            data: {
                txn: txnHex,
            },
        });

        return {
            res: res.data,
            txn: txnData,
            txnBytes,
            txnDataBytes: txn,
            txnHex,
        };
    }

    async join(ip: string, nonce?: number) {
        const id = Transaction.JOIN;
        const _chainId = this.getChainId();

        // const ipUtf8Bytes = Buffer.from(ip, 'utf8');

        const txnDataBytes = TransactionBuilder.getJoinTransaction(
            ip,
            nonce,
            _chainId
        );

        const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);
        const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
        const txnHex = Buffer.from(txnBytes).toString('hex');

        const res = await axios.post(`${url}/broadcast/`, { txn: txnHex });

        return {
            res: res.data,
            txnBytes,
            txnDataBytes,
            txnHex,
        };
    }

    async claimActiveNodeSpot(nonce?: number) {
        const id = Transaction.CLAIM_SPOT;
        const _chainId = this.getChainId();

        const txnDataBytes = generateTxnBytes(id, _chainId, nonce, '', '');

        const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);

        const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
        const txnHex = Buffer.from(txnBytes).toString('hex');

        const res = await axios.post(`${url}/broadcast/`, {
            txn: txnHex,
        });

        return {
            txnDataBytes,
            res: res.data,
            txnHex,
            txnBytes,
        };
    }

    async delegate(to: string, amount: string, nonce?: number) {
        const id = Transaction.DELEGATE;
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        const txnDataBytes = generateTxnBytes(id, _chainId, _nonce, amount, to);

        const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);

        const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
        const txnHex = Buffer.from(txnBytes).toString('hex');

        const res = await axios.post(`${url}/broadcast/`, { txn: txnHex });

        return {
            txnDataBytes,
            res: res.data,
            txnHex,
            txnBytes,
        };
    }

    async withdraw(from: string, sharesAmount: string, nonce?: number) {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        const txnDataBytes = TransactionBuilder.getWithdrawTransaction(
            from,
            sharesAmount,
            _nonce,
            _chainId
        );

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

        return {
            txnDataBytes,
            res: res.data,
            txnHex,
            txnBytes,
        };
    }

    async sendVMDataTxn(vmId: string, dataBytes: Uint8Array, nonce?: number) {
        const id = Transaction.VM_DATA_TXN;

        const _nonce = nonce || (await this.getNonce());

        const _vmId = vmId;

        const data = bytesToHex(dataBytes);
        const _chainId = this.getChainId();

        const txnDataBytes = TransactionBuilder.getVmDataTransaction(
            _vmId,
            data,
            _nonce,
            _chainId
        );

        const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);

        const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
        const txnHex = Buffer.from(txnBytes).toString('hex');

        const hashedTxnFinal = hashTxn(txnBytes);

        const hashedTxnStr = Buffer.from(hashedTxnFinal).toString('hex');

        const txn = {
            id,
            nonce,
            vmId,
            data,
            hash: `0x${hashedTxnStr}`,
        };

        const res = await axios({
            method: 'post',
            url: `${url}/broadcast/`,
            data: {
                txn: txnHex,
            },
        });

        return {
            res: res.data,
            txn,
            txnBytes,
            txnDataBytes,
            txnHex,
        };
    }

    // async sendPayableVmDataTransaction(
    //     vmId: string,
    //     value: string,
    //     dataBytes: Uint8Array,
    //     nonce?: number
    // ) {
    //     const id = Transaction.VM_DATA_TXN;

    //     const _nonce = nonce || (await this.getNonce());

    //     const _vmId = vmId;

    //     const data = bytesToHex(dataBytes);
    //     const _chainId = this.getChainId();

    //     const txnDataBytes = generateDataTxnBytes(
    //         id,
    //         _chainId,
    //         _nonce,
    //         _vmId,
    //         data
    //     );

    //     const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);

    //     const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
    //     const txnHex = Buffer.from(txnBytes).toString('hex');

    //     const hashedTxnFinal = hashTxn(txnBytes);

    //     const hashedTxnStr = Buffer.from(hashedTxnFinal).toString('hex');

    //     const txn = {
    //         id,
    //         nonce,
    //         vmId,
    //         data,
    //         hash: `0x${hashedTxnStr}`,
    //     };
    //     const res = await axios({
    //         method: 'post',
    //         url: `${url}/broadcast/`,
    //         data: {
    //             txn: txnHex,
    //         },
    //     });

    //     return {
    //         res: res.data,
    //         txn,
    //         txnBytes,
    //         txnDataBytes,
    //         txnHex,
    //     };
    // }

    // async claimVmId(vmId: string, nonce?: number) {
    //     const id = Transaction.CLAIM_VM_ID;
    //     const _nonce = nonce || (await this.getNonce());
    //     const _chainId = this.getChainId();

    //     const txnDataBytes = generateClaimTxnBytes(id, _nonce, _chainId, vmId);

    //     const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);

    //     const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
    //     const txnHex = Buffer.from(txnBytes).toString('hex');

    //     const res = await axios({
    //         method: 'post',
    //         url: `${url}/broadcast/`,
    //         data: {
    //             txn: txnHex,
    //         },
    //     });

    //     return {
    //         txnDataBytes,
    //         res: res.data,
    //         txnHex,
    //         txnBytes,
    //     };
    // }

    // async withdrawPWR(from: string, pwrAmount: string, nonce?: number) {
    //     const id = Transaction.WITHDRAW;

    //     const _nonce = nonce || (await this.getNonce());
    //     const _chainId = this.getChainId();

    //     const txnDataBytes = generateTxnBytes(
    //         id,
    //         _chainId,
    //         _nonce,
    //         pwrAmount,
    //         from
    //     );

    //     const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);

    //     const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
    //     const txnHex = Buffer.from(txnBytes).toString('hex');

    //     const res = await axios({
    //         method: 'post',
    //         url: `${url}/broadcast/`,
    //         data: {
    //             txn: txnHex,
    //         },
    //     });

    //     return {
    //         txnDataBytes,
    //         res: res.data,
    //         txnHex,
    //         txnBytes,
    //     };
    // }

    // #region validators

    async sendValidatorRemoveTxn(validator: string, nonce?: number) {
        const id = Transaction.REMOVE_VALIDATOR;
        const _chainId = this.getChainId();

        const validatorHex = validator.startsWith('0x')
            ? validator
            : `0x${validator}`;

        const txnDataBytes = generateDataTxnBytes(
            id,
            _chainId,
            nonce,
            validatorHex,
            ''
        );

        const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);

        const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
        const finalTxnHex = Buffer.from(txnBytes).toString('hex');

        const res = await axios.post(`${url}/broadcast/`, {
            txn: finalTxnHex,
        });

        return {
            txnDataBytes,
            res: res.data,
            finalTxnHex,
            txnBytes,
        };
    }

    async moveStake(
        shareAmount: string,
        fromValidator: string,
        toValidator: string,
        nonce?: number
    ) {
        const id = Transaction.TRANSFER;

        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        const txnDataBytes = generateTxnBytes(
            id,
            _chainId,
            _nonce,
            shareAmount,
            toValidator
        );

        const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);

        const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);

        const txnHex = Buffer.from(txnBytes).toString('hex');

        const res = await axios.post(`${url}/broadcast/`, {
            txn: txnHex,
        });

        return {
            txnDataBytes,
            res: res.data,
            txnHex,
            txnBytes,
        };
    }

    // #endregion

    // #region guardians

    async setGuardian(
        guardian: string,
        expiryDate: EpochTimeStamp,
        nonce?: number
    ) {
        const _chainId = this.getChainId();

        const txn = TransactionBuilder.getSetGuardianTransaction(
            guardian,
            expiryDate,
            nonce,
            _chainId
        );

        const signature = signTxn(txn, this.privateKey);

        const txnBytes = new Uint8Array([...txn, ...signature]);
        const txnHex = Buffer.from(txnBytes).toString('hex');

        const res = await axios.post(`${url}/broadcast/`, {
            txn: txnHex,
        });

        return {
            txnDataBytes: txn,
            res: res.data,
            txnHex,
            txnBytes,
        };
    }

    async sendGuardianApprovalTransaction(
        transactions: Uint8Array[],
        nonce?: number
    ) {
        const id = Transaction.SEND_GUARDIAN;

        const _nonce = nonce || (await this.getNonce());

        // const txnHex = Buffer.from(txn).toString('hex');
        const _chainId = this.getChainId();

        const txnDataBytes = TransactionBuilder.getGuardianApprovalTransaction(
            transactions,
            _nonce,
            _chainId
        );

        const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);

        const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
        const finalTxnHex = Buffer.from(txnBytes).toString('hex');

        const res = await axios.post(`${url}/broadcast/`, {
            txn: finalTxnHex,
        });

        return {
            txnDataBytes,
            res: res.data,
            txn: finalTxnHex,
            txnBytes,
        };
    }

    // async removeGuardian(nonce?: number) {
    //     const id = Transaction.REMOVE_GUARDIAN;
    //     const _chainId = this.getChainId();

    //     const txnDataBytes = generateTxnBytes(id, _chainId, nonce, '', '');

    //     const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);

    //     const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
    //     const txnHex = Buffer.from(txnBytes).toString('hex');

    //     const res = await axios.post(`${url}/broadcast/`, {
    //         txn: txnHex,
    //     });

    //     return {
    //         txnDataBytes,
    //         res: res.data,
    //         txnHex,
    //         txnBytes,
    //     };
    // }

    // #endregion

    // #region conduits

    async setConduits(vmId: string, conduits: string[], nonce?: number) {
        const id = Transaction.VM_DATA_TXN;
        const _chainId = this.getChainId();

        const vmIdHex = vmId.toString();
        const conduitsHex = conduits
            .map((conduit) => conduit.slice(2))
            .join('');

        const txnDataBytes = generateDataTxnBytes(
            id,
            _chainId,
            nonce,
            vmIdHex,
            conduitsHex
        );

        const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);

        const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
        const txnHex = Buffer.from(txnBytes).toString('hex');

        const res = await axios.post(`${url}/broadcast/`, {
            txn: txnHex,
        });

        return {
            txnDataBytes,
            res: res.data,
            txnHex,
            txnBytes,
        };
    }

    async sendConduitTransaction(
        vmId: number,
        txn: Uint8Array,
        nonce?: number
    ) {
        const id = Transaction.VM_DATA_TXN;

        const vmIdHex = vmId.toString(16);
        const txnHex = Buffer.from(txn).toString('hex');
        const _chainId = this.getChainId();

        const txnDataBytes = generateDataTxnBytes(
            id,
            _chainId,
            nonce,
            vmIdHex,
            txnHex
        );

        const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);

        const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
        const txnHexFinal = Buffer.from(txnBytes).toString('hex');

        const res = await axios.post(`${url}/broadcast/`, {
            txn: txnHexFinal,
        });

        return {
            txnDataBytes,
            res: res.data,
            txnHex,
            txnBytes,
        };
    }

    //#endregion
}
