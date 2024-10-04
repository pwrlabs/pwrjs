/* prettier-ignore */

import WalletUtils from '../wallet.utils';
import BigNumber from 'bignumber.js';
import { BnToBytes, bytesToHex, decToBytes } from '../utils';
import { keccak256 } from 'js-sha3';

import * as secp256k1 from 'secp256k1';
import TransactionBuilder from '../protocol/transaction-builder';
import { isConnected } from "./connection";

const pwrnode = 'https://pwrrpc.pwrlabs.io';

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

type TxnRes = {
    success: boolean;
    transactionHash: string;
    message: string;
};

declare global {
    interface PWR {
        getConnections: () => Promise<any>;
        transferPwr: (txnData: object) => Promise<string>;
        dataTransaction: (txnData: object) => Promise<string>;
        bytesDataTransaction: (txnData: object) => Promise<string>;
        payableVmDataTransaction: (txnData: object) => Promise<string>;
        claimIdVm: (txnData: object) => Promise<string>;
        delegate: (txnData: object) => Promise<string>;
        withdraw: (txnData: object) => Promise<string>;
        moveStake: (txnData: object) => Promise<string>;
        earlyWithdrawPenalty: (txnData: object) => Promise<string>;
        feePerByte: (txnData: object) => Promise<string>;
        otherProposal: (txnData: object) => Promise<string>;
        overallBurnPercentage: (txnData: object) => Promise<string>;
        rewardPerYear: (txnData: object) => Promise<string>;
        validatorCountLimit: (txnData: object) => Promise<string>;
        validatorJoiningFee: (txnData: object) => Promise<string>;
        vmIdClaimingFee: (txnData: object) => Promise<string>;
        vmOwnerTransactionFeeShare: (txnData: object) => Promise<string>;
        voteOnProposal: (txnData: object) => Promise<string>;
        maxBlockSize: (txnData: object) => Promise<string>;
        maxTransactionSize: (txnData: object) => Promise<string>;
    }

    interface Window {
        pwr?: PWR;
    }
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

async function sendTxn(txnHex: string, txnHash: string): Promise<TxnRes> {
    const url = `${pwrnode}/broadcast/`;

    try {
        const raw = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                txn: txnHex,
            }),
        });

        const res = await raw.json();

        if (!raw.ok) {
            return {
                success: false,
                transactionHash: '0x' + txnHash,
                message: res.message,
            };
        }

        return {
            success: true,
            transactionHash: '0x' + txnHash,
            message: null,
        };
    } catch (err) {
        throw err;
    }
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
        const rawRes = await fetch(
            `${pwrnode}/balanceOf/?userAddress=${this.address}`
        );
        const res = await rawRes.json();

        return res.balance;
    }

    async getNonce() {
        const rawRes = await fetch(
            `${pwrnode}/nonceOfUser/?userAddress=${this.address}`
        );

        const res = await rawRes.json();

        return res.nonce;
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

    async transferPWR(to: string, amount: string, website: boolean): Promise<TxnRes | string>;
    // prettier-ignore
    async transferPWR(to: string, amount: string, website: boolean, nonce: number): Promise<TxnRes | string>;
    // prettier-ignore
    async transferPWR(to: string, amount: string, website: boolean, nonce?: number): Promise<TxnRes | string> {
        const _nonce = nonce ?? (await this.getNonce());
        const _chainId = this.getChainId();

        if (website) {
            try {
                if ((await isConnected())) {
                    const account = await window.pwr.getConnections();

                    const res = await window.pwr.transferPwr({ from: account[0], to: to, amount: amount });
                    return res;
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            const txn = TransactionBuilder.getTransferPwrTransaction(
                _chainId,
                _nonce,
                amount,
                to
            );
    
            const res = await this.signAndSend(txn);
            return res;
        }
    }

    async join(ip: string): Promise<TxnRes>;
    async join(ip: string, nonce: number): Promise<TxnRes>;
    async join(ip: string, nonce?: number): Promise<TxnRes> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        const txnDataBytes = TransactionBuilder.getJoinTransaction(
            ip,
            _nonce,
            _chainId
        );

        const res = await this.signAndSend(txnDataBytes);

        return res;
    }

    async claimActiveNodeSpot(): Promise<TxnRes>;
    async claimActiveNodeSpot(nonce: number): Promise<TxnRes>;
    async claimActiveNodeSpot(nonce?: number): Promise<TxnRes> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        const txnDataBytes =
            TransactionBuilder.getClaimActiveNodeSpotTransaction(
                _nonce,
                _chainId
            );

        const res = await this.signAndSend(txnDataBytes);
        return res;
    }

    async sendVMDataTxn(vmId: string, data: string, website: boolean): Promise<TxnRes | string>;
    //prettier-ignore
    async sendVMDataTxn(vmId: string, data: string, website: boolean, nonce: number): Promise<TxnRes | string>;
    //prettier-ignore
    async sendVMDataTxn(vmId: string, data: string, website: boolean, nonce?: number): Promise<TxnRes | string> {
        const _nonce = nonce || (await this.getNonce());
        const _vmId = vmId;
        // const data = bytesToHex(dataBytes);
        const _chainId = this.getChainId();

        if (website) {
            try {
                if ((await isConnected())) {
                    const account = await window.pwr.getConnections();

                    const res = await window.pwr.dataTransaction({ from: account[0], vmId: _vmId, data: data });
                    return res;
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            const txnDataBytes = TransactionBuilder.getVmDataTransaction(
                _vmId,
                data,
                _nonce,
                _chainId
            );

            const res = await this.signAndSend(txnDataBytes);
            return res;
        }
    }

    async sendVMDataTxn2(vmId: string, data: Uint8Array, website: boolean): Promise<TxnRes | string>;
    // prettier-ignore
    async sendVMDataTxn2(vmId: string, data: Uint8Array, website: boolean, nonce: number): Promise<TxnRes | string>;
    // prettier-ignore
    async sendVMDataTxn2(vmId: string, data: Uint8Array, website: boolean, nonce?: number): Promise<TxnRes | string> {
        const _nonce = nonce || (await this.getNonce());
        const _vmId = vmId;
        const _chainId = this.getChainId();

        if (website) {
            try {
                if ((await isConnected())) {
                    const account = await window.pwr.getConnections();

                    const res = await window.pwr.bytesDataTransaction({ from: account[0], vmId: _vmId, data: data });
                    return res;
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            const txnDataBytes = TransactionBuilder.getVmDataTransaction2(
                _vmId,
                data,
                _nonce,
                _chainId
            );

            const res = await this.signAndSend(txnDataBytes);
            return res;
        }
    }

    // prettier-ignore
    async sendPayableVmDataTransaction(vmId: string, value: string, data: string, website: boolean): Promise<TxnRes | string>;
    // prettier-ignore
    async sendPayableVmDataTransaction(vmId: string, value: string, data: string, website: boolean, nonce: number): Promise<TxnRes | string>;
    // prettier-ignore
    async sendPayableVmDataTransaction(vmId: string, value: string, data: string, website: boolean, nonce?: number): Promise<TxnRes | string> {
        const _nonce = nonce || (await this.getNonce());
        const _vmId = vmId;
        const _chainId = this.getChainId();

        if (website) {
            try {
                if ((await isConnected())) {
                    const account = await window.pwr.getConnections();

                    const res = await window.pwr.payableVmDataTransaction({ from: account[0], vmId: _vmId, value: value, data: data });
                    return res;
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            const txnDataBytes = TransactionBuilder.getPayableVmDataTransaction(
                _vmId,
                value,
                data,
                _nonce,
                _chainId
            );

            const res = await this.signAndSend(txnDataBytes);
            return res;
        }
    }

    // #region validators

    async claimVmId(vmId: string, website: boolean): Promise<TxnRes | string>;
    async claimVmId(vmId: string, website: boolean, nonce: number): Promise<TxnRes | string>;
    async claimVmId(vmId: string, website: boolean, nonce?: number): Promise<TxnRes | string> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        if (website) {
            try {
                if ((await isConnected())) {
                    const account = await window.pwr.getConnections();

                    const res = await window.pwr.claimIdVm({ from: account[0], vmId: vmId });
                    return res;
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            const txnDataBytes = TransactionBuilder.getClaimVmIdTransaction(
                vmId,
                _nonce,
                _chainId
            );

            const res = await this.signAndSend(txnDataBytes);
            return res;
        }
    }

    async delegate(to: string, amount: string, website: boolean): Promise<TxnRes | string>;
    async delegate(to: string, amount: string, website: boolean, nonce: number): Promise<TxnRes | string>;
    // prettier-ignore
    async delegate(to: string, amount: string, website: boolean, nonce?: number): Promise<TxnRes | string> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        if (website) {
            try {
                if ((await isConnected())) {
                    const account = await window.pwr.getConnections();

                    const res = await window.pwr.delegate({ from: account[0], to: to, amount: amount });
                    return res;
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            const txnDataBytes = TransactionBuilder.getDelegatedTransaction(
                to,
                amount,
                _nonce,
                _chainId
            );

            const res = await this.signAndSend(txnDataBytes);
            return res;
        }
    }

    async withdraw(from: string, sharesAmount: string, website: boolean): Promise<TxnRes | string>;
    async withdraw(from: string, sharesAmount: string, website: boolean, nonce: number): Promise<TxnRes | string>;
    async withdraw(
        from: string,
        sharesAmount: string,
        website: boolean,
        nonce?: number
    ): Promise<TxnRes | string> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        if (website) {
            try {
                if ((await isConnected())) {
                    const account = await window.pwr.getConnections();

                    const res = await window.pwr.withdraw({ from: account[0], shares: sharesAmount });
                    return res;
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            const txnDataBytes = TransactionBuilder.getWithdrawTransaction(
                from,
                sharesAmount,
                _nonce,
                _chainId
            );

            const res = await this.signAndSend(txnDataBytes);
            return res;
        }
    }

    // prettier-ignore
    async moveStake(shareAmount: string, fromValidator: string, toValidator: string, website: boolean): Promise<TxnRes | string>;
    // prettier-ignore
    async moveStake(shareAmount: string, fromValidator: string, toValidator: string, website: boolean, nonce: number): Promise<TxnRes | string>;
    // prettier-ignore
    async moveStake(shareAmount: string, fromValidator: string, toValidator: string, website: boolean, nonce?: number): Promise<TxnRes | string> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        if (website) {
            try {
                if ((await isConnected())) {
                    const account = await window.pwr.getConnections();

                    const res = await window.pwr.moveStake({ from: account[0], sharesAmount: shareAmount, fromValidator: fromValidator, toValidator: toValidator });
                    return res;
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            const txnDataBytes = TransactionBuilder.getMoveStakeTransaction(
                shareAmount,
                fromValidator,
                toValidator,
                _nonce,
                _chainId
            );

            const res = await this.signAndSend(txnDataBytes);
            return res;
        }
    }

    // #endregion

    // #region guardians

    // prettier-ignore
    async setGuardian(guardian: string, expiryDate: EpochTimeStamp): Promise<TxnRes>;
    // prettier-ignore
    async setGuardian(guardian: string, expiryDate: EpochTimeStamp, nonce: number): Promise<TxnRes>;
    // prettier-ignore
    async setGuardian(guardian: string, expiryDate: EpochTimeStamp, nonce?: number): Promise<TxnRes> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        const txnDataBytes = TransactionBuilder.getSetGuardianTransaction(
            guardian,
            expiryDate,
            _nonce,
            _chainId
        );

        const res = await this.signAndSend(txnDataBytes);
        return res;
    }

    // prettier-ignore
    async sendGuardianApprovalTransaction(transactions: Uint8Array[]): Promise<TxnRes>;
    // prettier-ignore
    async sendGuardianApprovalTransaction(transactions: Uint8Array[], nonce: number): Promise<TxnRes>;
    // prettier-ignore
    async sendGuardianApprovalTransaction(transactions: Uint8Array[], nonce?: number): Promise<TxnRes> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        const txnDataBytes = TransactionBuilder.getGuardianApprovalTransaction(
            transactions,
            _nonce,
            _chainId
        );

        const res = await this.signAndSend(txnDataBytes);
        return res;
    }

    async removeGuardian(): Promise<TxnRes>;
    async removeGuardian(nonce: number): Promise<TxnRes>;
    async removeGuardian(nonce?: number): Promise<TxnRes> {
        const _chainId = this.getChainId();
        const _nonce = nonce || (await this.getNonce());

        const txnDataBytes = TransactionBuilder.getRemoveGuardianTransaction(
            _nonce,
            _chainId
        );

        const res = await this.signAndSend(txnDataBytes);
        return res;
    }

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
        const hashedTxnFinal = hashTxn(txnBytes);
        const hashedTxnStr = Buffer.from(hashedTxnFinal).toString('hex');

        const res = await sendTxn(txnHex, hashedTxnStr);
        return res;
    }

    async sendConduitTransaction(
        vmId: number,
        txn: Uint8Array,
        nonce?: number
    ) {
        const id = Transaction.VM_DATA_TXN;

        const vmIdHex = vmId.toString(16);
        const txnHex1 = Buffer.from(txn).toString('hex');
        const _chainId = this.getChainId();

        const txnDataBytes = generateDataTxnBytes(
            id,
            _chainId,
            nonce,
            vmIdHex,
            txnHex1
        );

        const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);
        const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);

        const txnHex = Buffer.from(txnBytes).toString('hex');
        const hashedTxnFinal = hashTxn(txnBytes);
        const hashedTxnStr = Buffer.from(hashedTxnFinal).toString('hex');

        const res = await sendTxn(txnHex, hashedTxnStr);
        return res;
    }

    //#endregion

    // #region proposals
    // prettier-ignore
    async createProposal_ChangeEarlyWithdrawalPenalty(withdrawlPenaltyTime: string, withdrawalPenalty: number, title: string, description: string, website: boolean): Promise<TxnRes | string>;
    // prettier-ignore
    async createProposal_ChangeEarlyWithdrawalPenalty(withdrawlPenaltyTime: string, withdrawalPenalty: number, title: string, description: string, website: boolean, nonce: number): Promise<TxnRes | string>;
    // prettier-ignore
    async createProposal_ChangeEarlyWithdrawalPenalty(
        withdrawlPenaltyTime: string, 
        withdrawalPenalty: number, 
        title: string, 
        description: string, 
        website: boolean, 
        nonce?: number
    ): Promise<TxnRes | string> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        if (website) {
            try {
                if ((await isConnected())) {
                    const account = await window.pwr.getConnections();

                    const res = await window.pwr.earlyWithdrawPenalty({ 
                        from: account[0], 
                        title: title, 
                        description: description, 
                        earlyWithdrawPenalty: withdrawalPenalty, 
                        earlyWithdrawTime: withdrawlPenaltyTime 
                    });
                    return res;
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            const txnDataBytes =
                TransactionBuilder.getChangeEarlyWithdrawPenaltyProposalTxn(
                withdrawlPenaltyTime,
                withdrawalPenalty,
                title,
                description,
                _nonce,
                _chainId
            );

            const res = await this.signAndSend(txnDataBytes);
            return res;
        }
    }

    // prettier-ignore
    async createProposal_ChangeFeePerByte(feePerByte: string, title: string, description: string, website: boolean): Promise<TxnRes | string>;
    // prettier-ignore
    async createProposal_ChangeFeePerByte(feePerByte: string, title: string, description: string, website: boolean,  nonce: number): Promise<TxnRes | string>;
    // prettier-ignore
    async createProposal_ChangeFeePerByte(feePerByte: string, title: string, description: string, website: boolean,  nonce?: number): Promise<TxnRes | string> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        if (website) {
            try {
                if ((await isConnected())) {
                    const account = await window.pwr.getConnections();

                    const res = await window.pwr.feePerByte({ 
                        from: account[0], feePerByte: feePerByte, title: title, description: description,
                    });
                    return res;
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            const txnDataBytes =
                TransactionBuilder.getChangeFeePerByteProposalTxn(
                feePerByte,
                title,
                description,
                _nonce,
                _chainId
            );

            const res = await this.signAndSend(txnDataBytes);
            return res;
        }
    }

    // prettier-ignore
    async createProposal_ChangeMaxBlockSize(maxBlockSize: number, title: string, description: string, website: boolean): Promise<TxnRes | string>;
    // prettier-ignore
    async createProposal_ChangeMaxBlockSize(maxBlockSize: number, title: string, description: string, website: boolean, nonce: number): Promise<TxnRes | string>;
    // prettier-ignore
    async createProposal_ChangeMaxBlockSize(maxBlockSize: number, title: string, description: string, website: boolean, nonce?: number): Promise<TxnRes | string> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        if (website) {
            try {
                if ((await isConnected())) {
                    const account = await window.pwr.getConnections();

                    const res = await window.pwr.maxBlockSize({ 
                        from: account[0], title: title, description: description, maxBlockSize: maxBlockSize
                    });
    
                    return res;
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            const txnDataBytes =
                TransactionBuilder.getChangeMaxBlockSizeProposalTxn(
                    maxBlockSize,
                    title,
                    description,
                    _nonce,
                    _chainId
                );
    
            const res = await this.signAndSend(txnDataBytes);
            return res;
        }
    }

    // prettier-ignore
    async createProposal_ChangeMaxTxnSize(maxTxnSize: number, title: string, description: string, website: boolean, nonce: number): Promise<TxnRes | string>;
    // prettier-ignore
    async createProposal_ChangeMaxTxnSize(maxTxnSize: number, title: string, description: string, website: boolean): Promise<TxnRes | string>;
    // prettier-ignore
    async createProposal_ChangeMaxTxnSize(maxTxnSize: number, title: string, description: string, website: boolean, nonce?: number): Promise<TxnRes | string> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        if (website) {            
            try {
                if ((await isConnected())) {
                    const account = await window.pwr.getConnections();

                    const res = await window.pwr.maxTransactionSize({ 
                        from: account[0], title: title, description: description, maxTxnSize: maxTxnSize
                    });
    
                    return res;
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            const txnDataBytes =
                TransactionBuilder.getChangeMaxTxnSizeProposalTxn(
                    maxTxnSize,
                    title,
                    description,
                    _nonce,
                    _chainId
                );
    
            const res = await this.signAndSend(txnDataBytes);
            return res;
        }
    }

    // prettier-ignore
    async createProposal_ChangeOverallBurnPercentage( burnPercentage: number, title: string, description: string, website: boolean, nonce: number): Promise<TxnRes | string>;
    // prettier-ignore
    async createProposal_ChangeOverallBurnPercentage( burnPercentage: number, title: string, description: string, website: boolean): Promise<TxnRes | string>;
    // prettier-ignore
    async createProposal_ChangeOverallBurnPercentage( burnPercentage: number, title: string, description: string, website: boolean, nonce?: number): Promise<TxnRes | string> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        if (website) {
            try {
                if ((await isConnected())) {
                    const account = await window.pwr.getConnections();

                    const res = await window.pwr.overallBurnPercentage({ 
                        from: account[0], title: title, description: description, overallBurnPercentage: burnPercentage
                    });
                    return res;
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            const txnDataBytes =
                TransactionBuilder.getChangeOverallBurnPercentageProposalTxn(
                    burnPercentage,
                    title,
                    description,
                    _nonce,
                    _chainId
                );

            const res = await this.signAndSend(txnDataBytes);
            return res;
        }
    }

    // prettier-ignore
    async createProposal_ChangeRewardPerYear(rewardPerYear: string, title: string, description: string, website: boolean, nonce: number): Promise<TxnRes | string>;
    // prettier-ignore
    async createProposal_ChangeRewardPerYear(rewardPerYear: string, title: string, description: string, website: boolean): Promise<TxnRes | string>;
    // prettier-ignore
    async createProposal_ChangeRewardPerYear(rewardPerYear: string, title: string, description: string, website: boolean, nonce?: number): Promise<TxnRes | string> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        if (website) {
            try {
                if ((await isConnected())) {
                    const account = await window.pwr.getConnections();

                    const res = await window.pwr.rewardPerYear({ 
                        from: account[0], title: title, description: description, rewardPerYear: rewardPerYear
                    });
                    return res;
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            const txnDataBytes =
                TransactionBuilder.getChangeRewardPerYearProposalTxn(
                    rewardPerYear,
                    title,
                    description,
                    _nonce,
                    _chainId
                );

            const res = await this.signAndSend(txnDataBytes);
            return res;
        }
    }

    // prettier-ignore
    async createProposal_ChangeValidatorCountLimit(validatorCountLimit: number, title: string, description: string, website: boolean, nonce: number): Promise<TxnRes | string>;
    // prettier-ignore
    async createProposal_ChangeValidatorCountLimit(validatorCountLimit: number, title: string, description: string, website: boolean): Promise<TxnRes | string>;
    // prettier-ignore
    async createProposal_ChangeValidatorCountLimit(validatorCountLimit: number, title: string, description: string, website: boolean, nonce?: number): Promise<TxnRes | string> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        if (website) {
            try {
                if ((await isConnected())) {
                    const account = await window.pwr.getConnections();

                    const res = await window.pwr.validatorCountLimit({ 
                        from: account[0], title: title, description: description, validatorCountLimit: validatorCountLimit
                    });
                    return res;
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            const txnDataBytes =
                TransactionBuilder.getChangeValidatorCountLimitProposalTxn(
                    validatorCountLimit,
                    title,
                    description,
                    _nonce,
                    _chainId
                );
    
            const res = await this.signAndSend(txnDataBytes);
            return res;
        }
    }

    // prettier-ignore
    async createProposal_ChangeValidatorJoiningFee( joiningFee: string, title: string, description: string, website: boolean): Promise<TxnRes | string>;
    // prettier-ignore
    async createProposal_ChangeValidatorJoiningFee( joiningFee: string, title: string, description: string, website: boolean,  nonce: number): Promise<TxnRes | string>;
    // prettier-ignore
    async createProposal_ChangeValidatorJoiningFee( joiningFee: string, title: string, description: string, website: boolean,  nonce?: number): Promise<TxnRes | string> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        if (website) {
            try {
                if ((await isConnected())) {
                    const account = await window.pwr.getConnections();

                    const res = await window.pwr.validatorJoiningFee({ 
                        from: account[0], title: title, description: description, validatorJoiningFee: joiningFee
                    });
                    return res;
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            const txnDataBytes =
                TransactionBuilder.getChangeValidatorJoiningFeeProposalTxn(
                    joiningFee,
                    title,
                    description,
                    _nonce,
                    _chainId
                );
    
            const res = await this.signAndSend(txnDataBytes);
            return res;
        }
    }

    // prettier-ignore
    async createProposal_ChangeVmIdClaimingFee(claimingFee: string , title: string, description: string, website: boolean): Promise<TxnRes | string>;
    // prettier-ignore
    async createProposal_ChangeVmIdClaimingFee(claimingFee: string , title: string, description: string, website: boolean, nonce: number): Promise<TxnRes | string>;
    // prettier-ignore
    async createProposal_ChangeVmIdClaimingFee(claimingFee: string , title: string, description: string, website: boolean, nonce?: number): Promise<TxnRes | string> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        if (website) {
            try {
                if ((await isConnected())) {
                    const account = await window.pwr.getConnections();

                    const res = await window.pwr.vmIdClaimingFee({ 
                        from: account[0], title: title, description: description, vmIdClaimingFee: claimingFee
                    });
                    return res;
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            const txnDataBytes =
                TransactionBuilder.getChangeVmIdClaimingFeeProposalTxn(
                    claimingFee,
                    title,
                    description,
                    _nonce,
                    _chainId
                );
    
            const res = await this.signAndSend(txnDataBytes);
            return res;
        }
    }

    // prettier-ignore
    async createProposal_ChangeVmOwnerTxnFeeShare( feeShare: number,  title: string,  description: string, website: boolean): Promise<TxnRes | string>;
    // prettier-ignore
    async createProposal_ChangeVmOwnerTxnFeeShare( feeShare: number,  title: string,  description: string, website: boolean,  nonce: number): Promise<TxnRes | string>;
    // prettier-ignore
    async createProposal_ChangeVmOwnerTxnFeeShare( feeShare: number,  title: string,  description: string, website: boolean,  nonce?: number): Promise<TxnRes | string> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        if (website) {
            try {
                if ((await isConnected())) {
                    const account = await window.pwr.getConnections();

                    const res = await window.pwr.vmOwnerTransactionFeeShare({ 
                        from: account[0], title: title, description: description, vmOwnerTxnFeeShare: feeShare
                    });
                    return res;
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            const txnDataBytes =
                TransactionBuilder.getChangeVmOwnerTxnFeeShareProposalTxn(
                    feeShare,
                    title,
                    description,
                    _nonce,
                    _chainId
                );
    
            const res = await this.signAndSend(txnDataBytes);
            return res;
        }
    }

    // prettier-ignore
    async createProposal_OtherProposal( title: string,  description: string, website: boolean): Promise<TxnRes | string>;
    // prettier-ignore
    async createProposal_OtherProposal( title: string,  description: string, website: boolean,  nonce: number): Promise<TxnRes | string>;
    // prettier-ignore
    async createProposal_OtherProposal( title: string,  description: string, website: boolean,  nonce?: number): Promise<TxnRes | string> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        if (website) {
            try {
                if ((await isConnected())) {
                    const account = await window.pwr.getConnections();

                    const res = await window.pwr.otherProposal({ 
                        from: account[0], title: title, description: description,
                    });
                    return res;
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            const txnDataBytes =
                TransactionBuilder.getOtherProposalTxn(
                    title,
                    description,
                    _nonce,
                    _chainId
                );

            const res = await this.signAndSend(txnDataBytes);
            return res;
        }
    }

    //prettier-ignore
    async voteProposal(proposalHash: string, vote: number, website: boolean): Promise<TxnRes | string>;
    //prettier-ignore
    async voteProposal(proposalHash: string, vote: number, website: boolean, nonce: number): Promise<TxnRes | string>;
    //prettier-ignore
    async voteProposal(proposalHash: string, vote: number, website: boolean, nonce?: number): Promise<TxnRes | string> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        if (website) {
            try {
                if ((await isConnected())) {
                    const account = await window.pwr.getConnections();

                    const res = await window.pwr.voteOnProposal({ 
                        from: account[0], proposalHash: proposalHash, vote: vote
                    });
                    return res;
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            const txnDataBytes =
                TransactionBuilder.getVoteOnProposalTxn(
                    proposalHash,
                    vote,
                    _nonce,
                    _chainId
                );
    
            const res = await this.signAndSend(txnDataBytes);
            return res;
        }
    }

    // #endregion

    private async signAndSend(txnDataBytes: Uint8Array): Promise<TxnRes> {
        const signedTxnBytes = signTxn(txnDataBytes, this.privateKey);
        const txnBytes = new Uint8Array([...txnDataBytes, ...signedTxnBytes]);

        const txnHex = Buffer.from(txnBytes).toString('hex');
        const hashedTxnFinal = hashTxn(txnBytes);
        const hashedTxnStr = Buffer.from(hashedTxnFinal).toString('hex');

        const res = await sendTxn(txnHex, hashedTxnStr);

        return res;
    }
}
