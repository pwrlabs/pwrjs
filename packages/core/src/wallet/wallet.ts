import axios from 'axios';
import WalletUtils from '../wallet.utils';
import BigNumber from 'bignumber.js';
import { BnToBytes, bytesToHex, decToBytes } from '../utils';
import { keccak256 } from 'js-sha3';

import * as secp256k1 from 'secp256k1';

const url = 'https://pwrrpc.pwrlabs.io';

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
        let txnDataBytes; // Ensure this is available in the function scope
        let txnBytes; // Declare it at the function level if you plan to use it outside the switch
        const { amount, to, nonce, vmId, dataBytes } = params;

        switch (transactionType) {
            case Transaction.TRANSFER: {
                const id = Transaction.TRANSFER;
                const _nonce = nonce || (await this.getNonce());
                const _chainId = this.getChainId();
                txnDataBytes = generateTxnBytes(
                    id,
                    _chainId,
                    _nonce,
                    amount,
                    to
                );

                const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);
                txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
                break;
            }
            case Transaction.VM_DATA_TXN: {
                const id = Transaction.VM_DATA_TXN;
                const _nonce = nonce || (await this.getNonce());
                const _vmId = vmId;
                const data = bytesToHex(dataBytes);
                const _chainId = this.getChainId();
                txnDataBytes = generateDataTxnBytes(
                    id,
                    _chainId,
                    _nonce,
                    _vmId,
                    data
                );

                const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);
                txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
                break;
            }
            // Add other cases as needed
            default:
                console.error(
                    'Unsupported transaction type for fee calculation'
                );
                return new BigNumber(0);
        }

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
        const txnDataBytes = generateTxnBytes(id, _chainId, _nonce, amount, to);

        const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);

        const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
        const txnHex = Buffer.from(txnBytes).toString('hex');

        const hashedTxnFinal = hashTxn(txnBytes);

        const hashedTxnStr = Buffer.from(hashedTxnFinal).toString('hex');

        const txn = {
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
            txn,
            txnBytes,
            txnDataBytes,
            txnHex,
        };
    }

    async sendVMDataTxn(vmId: string, dataBytes: Uint8Array, nonce?: number) {
        const id = Transaction.VM_DATA_TXN;

        const _nonce = nonce || (await this.getNonce());

        const _vmId = vmId;

        const data = bytesToHex(dataBytes);
        const _chainId = this.getChainId();

        const txnDataBytes = generateDataTxnBytes(
            id,
            _chainId,
            _nonce,
            _vmId,
            data
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

    async join(ip: string, nonce: number) {
        const id = Transaction.JOIN;
        const _chainId = this.getChainId();

        const ipHex = Buffer.from(ip).toString('hex');

        const vmIdPlaceholder = '';

        const txnDataBytes = generateDataTxnBytes(
            id,
            _chainId,
            nonce,
            vmIdPlaceholder,
            ipHex
        );

        const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);

        const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
        const txnHex = Buffer.from(txnBytes).toString('hex');

        try {
            const res = await axios.post(`${url}/broadcast/`, { txn: txnHex });

            return {
                txnDataBytes,
                res: res.data,
                txnHex,
                txnBytes,
            };
        } catch (error) {
            return {
                success: false,
                txnHash: '',
                error: error.message || 'An unknown error occurred',
            };
        }
    }

    async claimActiveNodeSpot(nonce: number) {
        const id = Transaction.CLAIM_SPOT;
        const _chainId = this.getChainId();

        const txnDataBytes = generateTxnBytes(id, _chainId, nonce, '', '');

        const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);

        const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
        const txnHex = Buffer.from(txnBytes).toString('hex');

        try {
            const res = await axios.post(`${url}/broadcast/`, {
                txn: txnHex,
            });

            if (res.data && res.data.txnHash) {
                return { success: true, txnHash: res.data.txnHash, error: '' };
            } else {
                return {
                    txnDataBytes,
                    res: res.data,
                    txnHex,
                    txnBytes,
                };
            }
        } catch (error) {
            return {
                success: false,
                txnHash: '',
                error: error.message || 'An unknown error occurred',
            };
        }
    }

    async delegate(to: string, amount: string, nonce?: number) {
        try {
            const id = Transaction.DELEGATE;
            const _nonce = nonce || (await this.getNonce());
            const _chainId = this.getChainId();

            const txnDataBytes = generateTxnBytes(
                id,
                _chainId,
                _nonce,
                amount,
                to
            );

            const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);

            const txnBytes = new Uint8Array([
                ...txnDataBytes,
                ...signedTxnBytes,
            ]);
            const txnHex = Buffer.from(txnBytes).toString('hex');

            const res = await axios.post(`${url}/broadcast/`, { txn: txnHex });

            if (res.data && res.data.txnHash) {
                return { success: true, txnHash: res.data.txnHash };
            } else {
                return {
                    txnDataBytes,
                    res: res.data,
                    txnHex,
                    txnBytes,
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Unknown error occurred.',
            };
        }
    }

    async withdraw(from: string, sharesAmount: string, nonce?: number) {
        const id = Transaction.WITHDRAW;

        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        const txnDataBytes = generateTxnBytes(
            id,
            _chainId,
            _nonce,
            sharesAmount,
            from
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
    async withdrawPWR(from: string, pwrAmount: string, nonce?: number) {
        const id = Transaction.WITHDRAW;

        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        const txnDataBytes = generateTxnBytes(
            id,
            _chainId,
            _nonce,
            pwrAmount,
            from
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
    async claimVmId(vmId: string, nonce?: number) {
        const id = Transaction.CLAIM_VM_ID;
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        const txnDataBytes = generateClaimTxnBytes(id, _nonce, _chainId, vmId);

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

    async sendConduitTransaction(vmId: number, txn: Uint8Array, nonce: number) {
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

        try {
            const res = await axios.post(`${url}/broadcast/`, {
                txn: txnHexFinal,
            });

            if (res.data && res.data.txnHash) {
                return { success: true, txnHash: res.data.txnHash, error: '' };
            } else {
                return {
                    txnDataBytes,
                    res: res.data,
                    txnHex,
                    txnBytes,
                };
            }
        } catch (error) {
            return {
                success: false,
                txnHash: '',
                error: error.message || 'An unknown error occurred',
            };
        }
    }
    async setGuardian(
        guardianAddress: Uint8Array,
        expiryDate: number,
        nonce: number
    ) {
        const id = Transaction.SET_GUARDIAN;
        const _chainId = this.getChainId();

        const guardianAddressHex = Buffer.from(guardianAddress).toString('hex');
        const txnDataBytes = generateDataTxnBytes(
            id,
            _chainId,
            nonce,
            '',
            guardianAddressHex + expiryDate.toString(16)
        );

        const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);

        const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
        const txnHex = Buffer.from(txnBytes).toString('hex');

        try {
            const res = await axios.post(`${url}/broadcast/`, {
                txn: txnHex,
            });

            if (res.data && res.data.txnHash) {
                return { success: true, txnHash: res.data.txnHash, error: '' };
            } else {
                return {
                    txnDataBytes,
                    res: res.data,
                    txnHex,
                    txnBytes,
                };
            }
        } catch (error) {
            return {
                success: false,
                txnHash: '',
                error: error.message || 'An unknown error occurred',
            };
        }
    }
    async removeGuardian(nonce: number) {
        const id = Transaction.REMOVE_GUARDIAN;
        const _chainId = this.getChainId();

        const txnDataBytes = generateTxnBytes(id, _chainId, nonce, '', '');

        const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);

        const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
        const txnHex = Buffer.from(txnBytes).toString('hex');

        try {
            const res = await axios.post(`${url}/broadcast/`, {
                txn: txnHex,
            });

            if (res.data && res.data.txnHash) {
                return { success: true, txnHash: res.data.txnHash, error: '' };
            } else {
                return {
                    txnDataBytes,
                    res: res.data,
                    txnHex,
                    txnBytes,
                };
            }
        } catch (error) {
            return {
                success: false,
                txnHash: '',
                error: error.message || 'An unknown error occurred',
            };
        }
    }
    async sendGuardianWrappedTransaction(txn: Uint8Array, nonce: number) {
        const id = Transaction.SEND_GUARDIAN;

        const txnHex = Buffer.from(txn).toString('hex');
        const _chainId = this.getChainId();

        const txnDataBytes = generateDataTxnBytes(
            id,
            _chainId,
            nonce,
            '',
            txnHex
        );

        const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);

        const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);
        const finalTxnHex = Buffer.from(txnBytes).toString('hex');

        try {
            const res = await axios.post(`${url}/broadcast/`, {
                txn: finalTxnHex,
            });

            if (res.data && res.data.txnHash) {
                return { success: true, txnHash: res.data.txnHash, error: '' };
            } else {
                return {
                    txnDataBytes,
                    res: res.data,
                    txnHex,
                    txn: finalTxnHex,
                    txnBytes,
                };
            }
        } catch (error) {
            return {
                success: false,
                txnHash: '',
                error: error.message || 'An unknown error occurred',
            };
        }
    }
    async sendValidatorRemoveTxn(validator: string, nonce: number) {
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

        try {
            const res = await axios.post(`${url}/broadcast/`, {
                txn: finalTxnHex,
            });

            if (res.data && res.data.txnHash) {
                return { success: true, txnHash: res.data.txnHash, error: '' };
            } else {
                return {
                    txnDataBytes,
                    res: res.data,
                    finalTxnHex,
                    txnBytes,
                };
            }
        } catch (error) {
            return {
                success: false,
                txnHash: '',
                error: error.message || 'An unknown error occurred',
            };
        }
    }
}
