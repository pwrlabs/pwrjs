/* prettier-ignore */

import WalletUtils from '../wallet.utils';
import BigNumber from 'bignumber.js';
import { BnToBytes, bytesToHex, decToBytes } from '../utils';
import { keccak256 } from 'js-sha3';
import EthereumWallet from 'ethereumjs-wallet';

import * as secp256k1 from 'secp256k1';
import TransactionBuilder from '../protocol/transaction-builder';
import { Transaction_ID } from '../static/enums/transaction.enum';
import { hexToBytes } from '@ethereumjs/util';
import HttpService from '../services/http.service';

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

function signTxn(txnBytes: Uint8Array, privateKey: Uint8Array) {
    const hashedBytes = keccak256.arrayBuffer(txnBytes);

    const signObj = secp256k1.ecdsaSign(
        new Uint8Array(hashedBytes),
        privateKey
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
    private _privateKey: Uint8Array;
    private chainId: number = 0;

    private s_httpSvc = new HttpService('https://pwrrpc.pwrlabs.io');

    constructor(privateKey?: string | Uint8Array) {
        let wallet: EthereumWallet;

        if (typeof privateKey === 'string') {
            wallet = WalletUtils.fromHex(privateKey);
        } else if (privateKey instanceof Uint8Array) {
            wallet = WalletUtils.fromBytes(privateKey);
        } else {
            wallet = WalletUtils.getRandomWallet();
        }

        this.privateKey = wallet.getPrivateKeyString();
        this.address = wallet.getAddressString();
        this._privateKey = wallet.getPrivateKey();
    }

    // *~~*~~*~~ GETTERS *~~*~~*~~ //

    getPublicKey() {
        const wallet = WalletUtils.fromHex(this.privateKey);

        const publicKey = wallet.getPublicKeyString();

        return publicKey;
    }

    getAddress() {
        const wallet = WalletUtils.fromHex(this.privateKey);

        const address = wallet.getAddressString();

        return address;
    }

    async getBalance() {
        // const rawRes = await fetch(
        //     `${pwrnode}/balanceOf/?userAddress=${this.address}`
        // );

        const res = await this.s_httpSvc.get<{ balance: bigint }>(
            `/balanceOf/?userAddress=${this.address}`
        );

        // const res = await rawRes.json();

        return res.balance;
    }

    async getNonce() {
        const res = await this.s_httpSvc.get<{ nonce: number }>(
            `/nonceOfUser/?userAddress=${this.address}`
        );

        return res.nonce;
    }

    /**
     *
     * returns the private key as a string
     *
     * @deprecated getPriavteKey will be removed in future versions, use getPrivateKeyHex or getPrivateKeyBytes instead
     *
     * @returns {string} the private key in hexadecimal format
     */
    getPrivateKey(): string {
        return this.privateKey;
    }

    getPrivateKeyHex(): string {
        return this.privateKey;
    }

    getPrivateKeyBytes(): Uint8Array {
        return this._privateKey;
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

        const signedTxnBytes = signTxn(txnDataBytes, this._privateKey);
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

    async transferPWR(to: string, amount: string): Promise<TxnRes>;
    // prettier-ignore
    async transferPWR(to: string, amount: string, nonce: number): Promise<TxnRes>;
    // prettier-ignore
    async transferPWR(to: string, amount: string, nonce?: number): Promise<TxnRes> {
        const _nonce = nonce ?? (await this.getNonce());

        const _chainId = this.getChainId();
        const txn = TransactionBuilder.getTransferPwrTransaction(
            to,
            amount,
            _nonce,
            _chainId,
        );

        const res = await this.signAndSend(txn);
        return res;
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

    async sendVMStringDataTxn(vmId: string, data: string): Promise<TxnRes>;
    //prettier-ignore
    async sendVMStringDataTxn(vmId: string, data: string, nonce: number): Promise<TxnRes>;
    //prettier-ignore
    async sendVMStringDataTxn(vmId: string, data: string, nonce?: number): Promise<TxnRes> {
        const _nonce = nonce || (await this.getNonce());

        const _vmId = vmId;

        // const data = bytesToHex(dataBytes);
        const _chainId = this.getChainId();

        const txnDataBytes = TransactionBuilder.getVmDataTransaction(
            _vmId,
            data,
            _nonce,
            _chainId
        );


        const res = await this.signAndSend(txnDataBytes);
        return res;
     
    }

    async sendVMDataTxn(vmId: string, data: Uint8Array): Promise<TxnRes>;
    // prettier-ignore
    async sendVMDataTxn(vmId: string, data: Uint8Array, nonce: number): Promise<TxnRes>;
    // prettier-ignore
    async sendVMDataTxn(vmId: string, data: Uint8Array, nonce?: number): Promise<TxnRes> {
        const _nonce = nonce || (await this.getNonce());

        const _vmId = vmId;

        const _chainId = this.getChainId();

        const txnDataBytes = TransactionBuilder.getVmBytesDataTransaction(
            _vmId,
            data,
            _nonce,
            _chainId
        );

        const res = await this.signAndSend(txnDataBytes);
        return res;
    }

    // prettier-ignore
    async sendPayableVmDataTransaction(vmId: string, value: string, data: Uint8Array): Promise<TxnRes>;
    // prettier-ignore
    async sendPayableVmDataTransaction(vmId: string, value: string, data: Uint8Array, nonce: number): Promise<TxnRes>;
    // prettier-ignore
    async sendPayableVmDataTransaction(vmId: string, value: string, data: Uint8Array, nonce?: number): Promise<TxnRes> {
        const _nonce = nonce || (await this.getNonce());

        const _vmId = vmId;

        const _chainId = this.getChainId();
      

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

    // #region validators

    async claimVmId(vmId: string): Promise<TxnRes>;
    async claimVmId(vmId: string, nonce: number): Promise<TxnRes>;
    async claimVmId(vmId: string, nonce?: number) {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        const txnDataBytes = TransactionBuilder.getClaimVmIdTransaction(
            BigInt(vmId),
            _nonce,
            _chainId
        );

        const res = await this.signAndSend(txnDataBytes);
        return res;
    }

    async delegate(to: string, amount: string): Promise<TxnRes>;
    async delegate(to: string, amount: string, nonce: number): Promise<TxnRes>;
    // prettier-ignore
    async delegate(to: string, amount: string, nonce?: number): Promise<TxnRes> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        const txnDataBytes = TransactionBuilder.getDelegatedTransaction(
            to,
            amount,
            _nonce,
            _chainId
        );

        const res = await this.signAndSend(txnDataBytes);
        return res;
    }

    async withdraw(from: string, sharesAmount: string): Promise<TxnRes>;
    async withdraw(from: string, sharesAmount: string, nonce): Promise<TxnRes>;
    async withdraw(
        from: string,
        sharesAmount: string,
        nonce?: number
    ): Promise<TxnRes> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

        const txnDataBytes = TransactionBuilder.getWithdrawTransaction(
            from,
            sharesAmount,
            _nonce,
            _chainId
        );

        const res = await this.signAndSend(txnDataBytes);
        return res;
    }

    // prettier-ignore
    async moveStake(shareAmount: string, fromValidator: string, toValidator: string): Promise<TxnRes>;
    // prettier-ignore
    async moveStake(shareAmount: string, fromValidator: string, toValidator: string, nonce: number): Promise<TxnRes>;
    // prettier-ignore
    async moveStake(shareAmount: string, fromValidator: string, toValidator: string, nonce?: number): Promise<TxnRes> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

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

        const signedTxnBytes = signTxn(txnDataBytes, this._privateKey);
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

        const signedTxnBytes = signTxn(txnDataBytes, this._privateKey);
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
    async createProposal_ChangeEarlyWithdrawalPenalty(withdrawlPenaltyTime: string, withdrawalPenalty: number, title: string, description: string): Promise<TxnRes>;
    // prettier-ignore
    async createProposal_ChangeEarlyWithdrawalPenalty(withdrawlPenaltyTime: string, withdrawalPenalty: number, title: string, description: string, nonce: number): Promise<TxnRes>;
    // prettier-ignore
    async createProposal_ChangeEarlyWithdrawalPenalty(withdrawlPenaltyTime: string, withdrawalPenalty: number, title: string, description: string, nonce?: number): Promise<TxnRes> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

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

    // prettier-ignore
    async createProposal_ChangeFeePerByte(feePerByte: string, title: string, description: string): Promise<TxnRes>;
    // prettier-ignore
    async createProposal_ChangeFeePerByte(feePerByte: string, title: string, description: string,  nonce: number): Promise<TxnRes>;
    // prettier-ignore
    async createProposal_ChangeFeePerByte(feePerByte: string, title: string, description: string,  nonce?: number): Promise<TxnRes> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

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

    // prettier-ignore
    async createProposal_ChangeMaxBlockSize(maxBlockSize: number, title: string, description: string): Promise<TxnRes>;
    // prettier-ignore
    async createProposal_ChangeMaxBlockSize(maxBlockSize: number, title: string, description: string, nonce: number): Promise<TxnRes>;
    // prettier-ignore
    async createProposal_ChangeMaxBlockSize(maxBlockSize: number, title: string, description: string, nonce?: number): Promise<TxnRes> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

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

    // prettier-ignore
    async createProposal_ChangeMaxTxnSizeSize( maxTxnSize: number,  title: string,  description: string, nonce: number): Promise<TxnRes>;
    // prettier-ignore
    async createProposal_ChangeMaxTxnSizeSize( maxTxnSize: number,  title: string,  description: string): Promise<TxnRes>;
    // prettier-ignore
    async createProposal_ChangeMaxTxnSizeSize( maxTxnSize: number,  title: string,  description: string, nonce?: number): Promise<TxnRes> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

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

    // prettier-ignore
    async createProposal_ChangeOverallBurnPercentage( burnPercentage: number,  title: string,  description: string, nonce: number): Promise<TxnRes>;
    // prettier-ignore
    async createProposal_ChangeOverallBurnPercentage( burnPercentage: number,  title: string,  description: string): Promise<TxnRes>;
    // prettier-ignore
    async createProposal_ChangeOverallBurnPercentage( burnPercentage: number,  title: string,  description: string, nonce?: number): Promise<TxnRes> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

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

    // prettier-ignore
    async createProposal_ChangeRewardPerYear(rewardPerYear: string, title: string,  description: string,  nonce: number): Promise<TxnRes>;
    // prettier-ignore
    async createProposal_ChangeRewardPerYear(rewardPerYear: string, title: string,  description: string): Promise<TxnRes>;
    // prettier-ignore
    async createProposal_ChangeRewardPerYear(rewardPerYear: string, title: string,  description: string, nonce?: number): Promise<TxnRes> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

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

    // prettier-ignore
    async createProposal_ChangeValidatorCountLimit(validatorCountLimit: number, title: string,  description: string,  nonce: number): Promise<TxnRes>;
    // prettier-ignore
    async createProposal_ChangeValidatorCountLimit(validatorCountLimit: number, title: string,  description: string): Promise<TxnRes>;
    // prettier-ignore
    async createProposal_ChangeValidatorCountLimit(validatorCountLimit: number, title: string,  description: string, nonce?: number): Promise<TxnRes> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

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

    // prettier-ignore
    async createProposal_ChangeValidatorJoiningFee( joiningFee: string,  title: string,  description: string): Promise<TxnRes>;
    // prettier-ignore
    async createProposal_ChangeValidatorJoiningFee( joiningFee: string,  title: string,  description: string,  nonce: number): Promise<TxnRes>;
    // prettier-ignore
    async createProposal_ChangeValidatorJoiningFee( joiningFee: string,  title: string,  description: string,  nonce?: number): Promise<TxnRes> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

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

    // prettier-ignore
    async createProposal_ChangeVmIdClaimingFee(claimingFee: string , title: string, description: string): Promise<TxnRes>;
    // prettier-ignore
    async createProposal_ChangeVmIdClaimingFee(claimingFee: string , title: string, description: string, nonce: number): Promise<TxnRes>;
    // prettier-ignore
    async createProposal_ChangeVmIdClaimingFee(claimingFee: string , title: string, description: string, nonce?: number): Promise<TxnRes> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

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

    // prettier-ignore
    async createProposal_ChangeVmOwnerTxnFeeShare( feeShare: number,  title: string,  description: string): Promise<TxnRes>;
    // prettier-ignore
    async createProposal_ChangeVmOwnerTxnFeeShare( feeShare: number,  title: string,  description: string,  nonce: number): Promise<TxnRes>;
    // prettier-ignore
    async createProposal_ChangeVmOwnerTxnFeeShare( feeShare: number,  title: string,  description: string,  nonce?: number): Promise<TxnRes> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

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

    // prettier-ignore
    async createProposal_OtherProposal( title: string,  description: string): Promise<TxnRes>;
    // prettier-ignore
    async createProposal_OtherProposal( title: string,  description: string,  nonce: number): Promise<TxnRes>;
    // prettier-ignore
    async createProposal_OtherProposal( title: string,  description: string,  nonce?: number): Promise<TxnRes> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

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

    //prettier-ignore
    async voteProposal( proposalHash: string,  vote: number): Promise<TxnRes>;
    //prettier-ignore
    async voteProposal( proposalHash: string,  vote: number,  nonce: number): Promise<TxnRes>;
    //prettier-ignore
    async voteProposal( proposalHash: string,  vote: number,  nonce?: number): Promise<TxnRes> {
        const _nonce = nonce || (await this.getNonce());
        const _chainId = this.getChainId();

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

    // #endregion

    // #region save and load
    /**
     * Browser implementation using Web Crypto API.
     * Encrypts privateKeyBytes (Uint8Array) using AES-GCM with a key derived via PBKDF2.
     *
     * @param {Uint8Array} privateKeyBytes - The private key as a byte array.
     * @param {string} password - The password used for key derivation.
     * @returns {Promise<Uint8Array>} A promise that resolves to the encrypted data.
     */
    async encryptPrivateKeyBrowser(password: string): Promise<any> {
        const privateKeyBytes = hexToBytes(this.privateKey);
        const passwordBytes = new TextEncoder().encode(password);

        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12)); // Recommended 12-byte IV for AES-GCM

        // Import the password as key material.
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            passwordBytes,
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        const derivedKey = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                hash: 'SHA-256',
                salt: salt,
                iterations: 100000,
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt']
        );

        const encryptedBuffer = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            derivedKey,
            privateKeyBytes
        );

        // Combine salt + iv + ciphertext for storage/transport.
        const encryptedBytes = new Uint8Array(
            salt.byteLength + iv.byteLength + encryptedBuffer.byteLength
        );
        encryptedBytes.set(salt, 0);
        encryptedBytes.set(iv, salt.byteLength);
        encryptedBytes.set(
            new Uint8Array(encryptedBuffer),
            salt.byteLength + iv.byteLength
        );

        return encryptedBytes;
    }

    /**
     * Node.js implementation using Node's crypto module.
     * Encrypts privateKeyBytes (Buffer or Uint8Array) using AES-256-GCM with a key derived via PBKDF2.
     *
     * @param {Uint8Array} privateKeyBytes - The private key as a byte array.
     * @param {string} password - The password used for key derivation.
     * @returns {Uint8Array} The encrypted data.
     */
    encryptPrivateKeyNode(password) {
        const crypto = require('crypto') as typeof import('crypto');

        // Generate random salt and IV.
        const salt = crypto.randomBytes(16);
        const iv = crypto.randomBytes(12);

        // Derive a 32-byte key using PBKDF2.
        const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

        // Create cipher.
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        const encrypted = Buffer.concat([
            cipher.update(this._privateKey),
            cipher.final(),
        ]);
        const authTag = cipher.getAuthTag();

        // Combine salt + iv + authTag + ciphertext.
        return Buffer.concat([salt, iv, authTag, encrypted]);
    }

    /**
     * Browser decryption implementation using the Web Crypto API.
     * Assumes the input is formatted as: salt (16 bytes) | iv (12 bytes) | ciphertext (includes auth tag).
     *
     * @param {Uint8Array} encryptedBytes - The encrypted data.
     * @param {string} password - The password used for key derivation.
     * @returns {Promise<Uint8Array>} A promise resolving to the decrypted private key bytes.
     */
    async decryptPrivateKeyBrowser(
        encryptedBytes: Uint8Array,
        password: string
    ): Promise<Uint8Array> {
        const encoder = new TextEncoder();

        // Extract salt and iv from the encrypted data.
        const salt = encryptedBytes.slice(0, 16);
        const iv = encryptedBytes.slice(16, 28);
        const ciphertext = encryptedBytes.slice(28);

        // Import the password as key material.
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        // Derive the AES-GCM key.
        const key = await window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256',
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );

        // Decrypt the ciphertext.
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            ciphertext
        );

        return new Uint8Array(decryptedBuffer);
    }

    /**
     * Node.js decryption implementation using the built-in crypto module.
     * Assumes the input is formatted as: salt (16 bytes) | iv (12 bytes) | authTag (16 bytes) | ciphertext.
     *
     * @param {Uint8Array|Buffer} encryptedBytes - The encrypted data.
     * @param {string} password - The password used for key derivation.
     * @returns {Uint8Array} The decrypted private key bytes.
     */
    decryptPrivateKeyNode(
        encryptedBytes: Uint8Array,
        password: string
    ): Uint8Array {
        const crypto = require('crypto') as typeof import('crypto');

        // Extract the parts.
        const salt = encryptedBytes.slice(0, 16);
        const iv = encryptedBytes.slice(16, 28);
        const authTag = encryptedBytes.slice(28, 44);
        const ciphertext = encryptedBytes.slice(44);

        // Derive the key.
        const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

        // Create a decipher and set the authentication tag.
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);

        // Decrypt the data.
        const decrypted = Buffer.concat([
            decipher.update(ciphertext),
            decipher.final(),
        ]);
        return new Uint8Array(decrypted);
    }

    /**
     * Encrypts the wallet's private key and saves it to a file with .enc extension.
     *
     * @param password a string to encrypt the wallet
     * @param filePath if executing in node, the path to save the wallet
     */
    async storeWallet(password: string, filePath?: string) {
        // Check for browser environment by testing if 'window' and 'crypto.subtle' are available.
        const isBrowser =
            typeof window !== 'undefined' &&
            window.crypto &&
            window.crypto.subtle;

        if (isBrowser) {
            // Browser: Encrypt and then trigger a file download.
            const encryptedData = await this.encryptPrivateKeyBrowser(password);

            // Create a Blob from the encrypted data.
            const blob = new Blob([encryptedData], {
                type: 'application/octet-stream',
            });
            // Create a temporary URL for the Blob.
            const url = window.URL.createObjectURL(blob);
            // Create an invisible anchor element and trigger the download.
            const a = document.createElement('a');
            a.href = url;
            a.download = 'wallet.enc'; // Specify the file name.
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } else {
            if (!filePath)
                throw new Error('filePath is required in Node.js environment');

            // Node.js: Encrypt and then save the file to disk.
            const encryptedData = this.encryptPrivateKeyNode(password);
            // Import the Node.js file system module.
            const fs = require('fs') as typeof import('fs');
            const path = require('path') as typeof import('path');
            // Define the path where you want to save the wallet.
            const name = 'wallet.enc';

            const _p = path.join(filePath, name);
            // Write the encrypted data to the file.
            fs.writeFileSync(_p, encryptedData);
        }
    }

    async loadWallet(password: string, filepath?: string): Promise<PWRWallet> {
        // Detect whether we're in the browser.
        const isBrowser =
            typeof window !== 'undefined' &&
            window.crypto &&
            window.crypto.subtle;

        if (isBrowser) {
            // In the browser: Prompt the user to select a file and then read it.
            // return new Promise<Uint8Array>((resolve, reject) => {
            //     // Create an invisible file input element.
            //     const input = document.createElement('input');
            //     input.type = 'file';
            //     input.accept = '.enc'; // accept only files with .enc extension (adjust if needed)
            //     // When a file is selected, read it.
            //     input.onchange = async () => {
            //         try {
            //             if (!input.files || input.files.length === 0) {
            //                 return reject(new Error('No file selected'));
            //             }
            //             const file = input.files[0];
            //             // Convert the file to an ArrayBuffer.
            //             const arrayBuffer = await file.arrayBuffer();
            //             const encryptedData = new Uint8Array(arrayBuffer);
            //             // Decrypt the wallet using the browser-specific decryption function.
            //             const decryptedData =
            //                 await this.decryptPrivateKeyBrowser(
            //                     encryptedData,
            //                     password
            //                 );
            //             resolve(decryptedData);
            //         } catch (error) {
            //             reject(error);
            //         }
            //     };
            //     // Programmatically trigger the file selection dialog.
            //     input.click();
            // });
        } else {
            // In Node.js: Read the file from disk.
            const fs = require('fs');
            const path = require('path');

            // Adjust the file path as needed.
            const filePath = path.join(filepath, 'wallet.enc');

            // Read the file synchronously (you can use async version if you prefer).
            const encryptedData = fs.readFileSync(filePath);
            // Decrypt using the Node.js decryption function.
            const privateKeyBytes = this.decryptPrivateKeyNode(
                encryptedData,
                password
            );

            return new PWRWallet(privateKeyBytes);
        }
    }

    // #endregion

    // #region utils

    private async signAndSend(txnDataBytes: Uint8Array): Promise<TxnRes> {
        // const pkbytes = hexToBytes(this.privateKey);
        const signature = signTxn(txnDataBytes, this._privateKey);
        const txnBytes = new Uint8Array([...txnDataBytes, ...signature]);

        const txnHex = Buffer.from(txnBytes).toString('hex');
        const hashedTxnFinal = hashTxn(txnBytes);
        const hashedTxnStr = Buffer.from(hashedTxnFinal).toString('hex');

        const res = await sendTxn(txnHex, hashedTxnStr);

        return res;
    }

    // #endregion
}
