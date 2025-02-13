import BigNumber from 'bignumber.js';
import {
    BnToBytes,
    HexToBytes,
    bytesToHex,
    decToBytes,
    decToBytes2,
    decodeHex,
} from '../utils';
import { Transaction_ID } from '../static/enums/transaction.enum';

function assetAddressValidity(to: string): void {
    // Implement your address validation logic here.  This is a placeholder.
    // Example (replace with your actual validation):
    if (!to.startsWith('0x') || to.length !== 42) {
        throw new Error('Invalid address format');
    }
}

export default class TransactionBuilder {
    private static getTransactionBase(
        id: Transaction_ID,
        chainId: number,
        nonce: number
    ) {
        const buffer = new ArrayBuffer(9);
        const view = new DataView(buffer);

        view.setInt32(0, id);
        view.setUint8(4, chainId);
        view.setInt32(5, nonce);

        const byteArray = new Uint8Array(buffer);

        return byteArray;
    }

    static getTransferPwrTransaction(
        to: string,
        amount: string,
        nonce: number,
        chainId: number
    ): Uint8Array {
        assetAddressValidity(to);

        const amountBigInt = BigInt(amount);
        const amountBN = BigNumber(amount);

        if (amountBN.comparedTo(0) < 0) {
            throw new Error('Amount cannot be negative');
        }
        if (nonce < 0) {
            throw new Error('Nonce cannot be negative');
        }

        /*
         * Identifier - 4
         * chain id - 1
         * Nonce - 4
         * amount - 8
         * address - 20
         * signature - 65*/

        const base = this.getTransactionBase(
            Transaction_ID.TRANSFER,
            chainId,
            nonce
        );

        const buffer = new Uint8Array(base.length + 8 + 20);

        buffer.set(base, 0); // copy base

        //write the amount as a long 8 bytes
        const amountBytes = new Uint8Array(8);
        const dataView = new DataView(amountBytes.buffer);
        dataView.setBigUint64(0, amountBigInt, false);
        buffer.set(amountBytes, base.length);

        const toBytes = decodeHex(to.substring(2));
        buffer.set(toBytes, base.length + 8);

        return buffer;
    }

    static getJoinTransaction(
        ip: string,
        nonce: number,
        chainId: number
    ): Uint8Array {
        const base = this.getTransactionBase(
            Transaction_ID.JOIN,
            chainId,
            nonce
        );

        const ipBytes = new TextEncoder().encode(ip);
        const txnBytes = new Uint8Array([...base, ...ipBytes]);

        return txnBytes;
    }

    static getClaimActiveNodeSpotTransaction(
        nonce: number,
        chainId: number
    ): Uint8Array {
        const base = this.getTransactionBase(
            Transaction_ID.CLAIM_SPOT,
            chainId,
            nonce
        );

        return base;
    }

    static getDelegatedTransaction(
        validator: string,
        amount: string,
        nonce: number,
        chainId: number
    ) {
        const amountBN = BigNumber(amount);

        if (amountBN.comparedTo(0) < 0) {
            throw new Error('Amount cannot be negative');
        }
        if (nonce < 0) {
            throw new Error('Nonce cannot be negative');
        }

        /*
         * Identifier - 1
         * chain id - 1
         * Nonce - 4
         * amount - 8
         * validator - 20
         * signature - 65*/

        const base = this.getTransactionBase(
            Transaction_ID.DELEGATE,
            chainId,
            nonce
        );
        const b_amount = BnToBytes(amountBN);

        const b_validator = HexToBytes(validator);

        const txnBytes = new Uint8Array([...base, ...b_amount, ...b_validator]);

        return txnBytes;
    }

    static getWithdrawTransaction(
        validator: string,
        sharesAmount: string,
        nonce: number,
        chainId: number
    ): Uint8Array {
        const sharesAmountBN = BigNumber(sharesAmount);
        if (sharesAmountBN.comparedTo(0) < 0) {
            throw new Error('Shares amount cannot be negative');
        }
        if (nonce < 0) {
            throw new Error('Nonce cannot be negative');
        }

        const base = this.getTransactionBase(
            Transaction_ID.WITHDRAW,
            chainId,
            nonce
        );
        const b_sharesAmount = BnToBytes(sharesAmountBN);
        const b_validator = HexToBytes(validator);

        const txnBytes = new Uint8Array([
            ...base,
            ...b_sharesAmount,
            ...b_validator,
        ]);

        return txnBytes;
    }

    static getVmDataTransaction(
        vmId: string,
        data: string,
        nonce: number,
        chainId: number
    ): Uint8Array {
        if (nonce < 0) {
            throw new Error('Nonce cannot be negative');
        }

        const b_data = new TextEncoder().encode(data);

        const buffer = TransactionBuilder.getVmBytesDataTransaction(
            vmId,
            b_data,
            nonce,
            chainId
        );

        return buffer;
    }

    static getVmBytesDataTransaction(
        vmId: string,
        data: Uint8Array,
        nonce: number,
        chainId: number
    ): Uint8Array {
        if (nonce < 0) {
            throw new Error('Nonce cannot be negative');
        }

        const _vmId = BigInt(vmId);

        const base = this.getTransactionBase(
            Transaction_ID.VM_DATA_TXN,
            chainId,
            nonce
        );

        const buffer = new Uint8Array(base.length + 8 + 4 + data.length);

        buffer.set(base, 0);

        // write vmid
        const vmIdBytes = new Uint8Array(8);
        const vmIdDataView = new DataView(vmIdBytes.buffer);
        vmIdDataView.setBigUint64(0, _vmId, false);
        buffer.set(vmIdBytes, base.length);

        // write data length
        buffer.set(data, base.length + 8 + 4);

        return buffer;
    }

    static getClaimVmIdTransaction(
        vmId: bigint,
        nonce: number,
        chainId: number
    ): Uint8Array {
        const base = this.getTransactionBase(
            Transaction_ID.CLAIM_VM_ID,
            chainId,
            nonce
        );

        const buffer = new Uint8Array(base.length + 8);

        buffer.set(base, 0);

        const vmIdBytes = new Uint8Array(8);
        const dataview = new DataView(vmIdBytes.buffer);
        dataview.setBigUint64(0, vmId, false);

        buffer.set(vmIdBytes, base.length);

        return buffer;
    }

    static getSetGuardianTransaction(
        guardian: string,
        expiryDate: EpochTimeStamp,
        nonce: number,
        chainId: number
    ) {
        if (nonce < 0) {
            throw new Error('Nonce cannot be negative');
        }
        if (expiryDate < 0) {
            throw new Error('Expiry date cannot be negative');
        }
        if (expiryDate < Date.now() / 1000) {
            throw new Error('Expiry date cannot be in the past');
        }

        /*
         * Identifier - 1
         * chain id - 1
         * Nonce - 4
         * Long - 8
         * address - 20
         * signature - 65
         * */

        const base = this.getTransactionBase(
            Transaction_ID.SET_GUARDIAN,
            chainId,
            nonce
        );

        const b_expiryDate = decToBytes2(expiryDate, 8);

        const b_guardian = HexToBytes(guardian);

        const txnBytes = new Uint8Array([
            ...base,
            ...b_expiryDate,
            ...b_guardian,
        ]);

        return txnBytes;
    }

    static getRemoveGuardianTransaction(
        nonce: number,
        chainId: number
    ): Uint8Array {
        if (nonce < 0) {
            throw new Error('Nonce cannot be negative');
        }

        /*
         * Identifier - 1
         * chain id - 1
         * Nonce - 4
         * */

        const base = this.getTransactionBase(
            Transaction_ID.REMOVE_GUARDIAN,
            chainId,
            nonce
        );

        return base;
    }

    static getGuardianApprovalTransaction(
        transactions: Uint8Array[],
        nonce: number,
        chainId: number
    ): Uint8Array {
        // let totalLength = 0;
        // for (let t in transactions) {
        //     totalLength += t.length;
        // }

        const base = this.getTransactionBase(
            Transaction_ID.GUARDIAN_TXN,
            chainId,
            nonce
        );

        let arr = [...base];

        for (let transaction of transactions) {
            const txnLength = decToBytes(transaction.length, 4);
            arr.push(...txnLength, ...transaction);
        }

        const txnBytes = new Uint8Array(arr);

        return txnBytes;
    }

    public static getPayableVmDataTransaction(
        vmId: string,
        value: string,
        data: Uint8Array,
        nonce: number,
        chainId: number
    ) {
        if (nonce < 0) {
            throw new Error('Nonce cannot be negative');
        }

        const base = this.getTransactionBase(
            Transaction_ID.PAYABLE_VM_DATA_TXN,
            chainId,
            nonce
        );

        const buffer = new Uint8Array(base.length + 16 + 4 + data.length);

        buffer.set(base, 0);

        const vmIdBytes = new Uint8Array(8);
        const vmIdDataView = new DataView(vmIdBytes.buffer);
        vmIdDataView.setBigUint64(0, BigInt(vmId), false);
        buffer.set(vmIdBytes, base.length);

        // write data
        const dataLengthBytes = new Uint8Array(4);
        const dataLengthDataView = new DataView(dataLengthBytes.buffer);
        dataLengthDataView.setInt32(0, data.length, false);
        buffer.set(dataLengthBytes, base.length + 8);

        buffer.set(data, base.length + 8 + 4);

        const valueBytes = new Uint8Array(8);
        const valueDataview = new DataView(valueBytes.buffer);
        valueDataview.setBigUint64(0, BigInt(value), false);
        buffer.set(valueBytes, base.length + 8 + 4 + data.length);

        return buffer;
    }

    // public static getValidatorRemoveTransaction(
    //     validator: string,
    //     nonce: number,
    //     chainId: number
    // ): Uint8Array {
    //     // assetAddressValidity(validator);

    //     if (nonce < 0) {
    //         throw new Error('Nonce cannot be negative');
    //     }

    //     const base = this.getTransactionBase(
    //         Transaction_ID.REMOVE_VALIDATOR,
    //         chainId,
    //         nonce
    //     );
    //     const b_validator = HexToBytes(validator);

    //     const bytes = new Uint8Array([...base, ...b_validator]);

    //     return bytes;
    // }

    // public static getConduitApprovalTransaction(vmId: string,  transactions: strn, int nonce, byte chainId) {
    //     if (nonce < 0) {
    //         throw new RuntimeException("Nonce cannot be negative");
    //     }
    //     if (transactions.size() == 0) {
    //         throw new RuntimeException("No transactions to approve");
    //     }

    //     int totalTransactionsLength = 0;
    //     for (byte[] Transaction : transactions) {
    //         totalTransactionsLength += Transaction.length;
    //     }

    //     byte[] TransactionBase = getTransactionBase((byte) 12, nonce, chainId);
    //     ByteBuffer buffer = ByteBuffer.allocate(TransactionBase.length + 8 + (transactions.size() * 4) + totalTransactionsLength);
    //     buffer.put(TransactionBase);
    //     buffer.putLong(vmId);

    //     for (byte[] Transaction : transactions) {
    //         buffer.putInt(Transaction.length);
    //         buffer.put(Transaction);
    //     }

    //     return buffer.array();
    // }

    static getMoveStakeTransaction(
        sharesAmount: string,
        fromValidator: string,
        toValidator: string,
        nonce: number,
        chainId: number
    ) {
        if (nonce < 0) {
            throw new Error('nonce cannot be negative');
        }

        const base = this.getTransactionBase(
            Transaction_ID.MOVE_STAKE,
            chainId,
            nonce
        );

        const b_shares = BnToBytes(new BigNumber(sharesAmount));
        const b_from = HexToBytes(fromValidator);
        const b_to = HexToBytes(toValidator);

        const txnBytes = new Uint8Array([
            ...base,
            ...b_shares,
            ...b_from,
            ...b_to,
        ]);

        return txnBytes;
    }

    // #region proposal

    static getChangeEarlyWithdrawPenaltyProposalTxn(
        withdrawalPenaltyTime: string, // time in seconds
        withdrawalPenalty: number, // x/10000 number
        title: string,
        description: string,
        nonce: number,
        chainId: number
    ) {
        const base = this.getTransactionBase(
            Transaction_ID.CHANGE_EARLY_WITHDRAW_PENALTY_PROPOSAL,
            chainId,
            nonce
        );

        /*
        Identifier - 1
        chain id - 1
        nonce - 4
        title size identifier - 4
        title - x
        withdrawal penalty time - 8
        withdrawal penalty - 4
        description - x
        signature - 65
        */

        const b_title = new TextEncoder().encode(title);
        const b_title_length = decToBytes(b_title.length, 4);
        const b_withdrawalPenaltyTime = BnToBytes(
            BigNumber(withdrawalPenaltyTime)
        );
        const b_withdrawalPenalty = decToBytes(withdrawalPenalty, 4);
        const b_description = new TextEncoder().encode(description);

        //
        const txnBytes = new Uint8Array([
            ...base,
            ...b_title_length,
            ...b_title,
            ...b_withdrawalPenaltyTime,
            ...b_withdrawalPenalty,
            ...b_description,
        ]);

        return txnBytes;
    }

    static getChangeFeePerByteProposalTxn(
        feePerByte: string, //big number
        title: string,
        description: string,
        nonce: number,
        chainId: number
    ) {
        const base = this.getTransactionBase(
            Transaction_ID.CHANGE_FEE_PER_BYTE_PROPOSAL,
            chainId,
            nonce
        );

        /*
        Identifier - 1
        chain id - 1
        nonce - 4
        title size identifier - 4
        title - x
        fee per byte - 8
        description - x
        signature - 65
        */

        const b_title = new TextEncoder().encode(title);
        const b_title_length = decToBytes(b_title.length, 4);
        const b_feePerByte = BnToBytes(new BigNumber(feePerByte));
        const b_description = new TextEncoder().encode(description);

        const txnBytes = new Uint8Array([
            ...base,
            ...b_title_length,
            ...b_title,
            ...b_feePerByte,
            ...b_description,
        ]);

        return txnBytes;
    }

    static getChangeMaxBlockSizeProposalTxn(
        maxBlockSize: number,
        title: string,
        description: string,
        nonce: number,
        chainId: number
    ) {
        const base = this.getTransactionBase(
            Transaction_ID.CHANGE_MAX_BLOCK_SIZE_PROPOSAL,
            chainId,
            nonce
        );

        /*
        Identifier - 1
        chain id - 1
        nonce - 4
        title size identifier - 4
        title - x
        max block size - 4
        description - x
        signature - 65
        */

        const b_title = new TextEncoder().encode(title);
        const b_title_length = decToBytes(b_title.length, 4);
        const b_maxBlockSize = decToBytes(maxBlockSize, 4);
        const b_description = new TextEncoder().encode(description);

        const txnBytes = new Uint8Array([
            ...base,
            ...b_title_length,
            ...b_title,
            ...b_maxBlockSize,
            ...b_description,
        ]);

        return txnBytes;
    }

    static getChangeMaxTxnSizeProposalTxn(
        maxTxnSize: number,
        title: string,
        description: string,
        nonce: number,
        chainId: number
    ) {
        const base = this.getTransactionBase(
            Transaction_ID.CHANGE_MAX_TXN_SIZE_PROPOSAL,
            chainId,
            nonce
        );

        /*
        Identifier - 1
        chain id - 1
        nonce - 4
        title size identifier - 4
        title - x
        max txn size - 4
        description - x
        signature - 65
        */

        const b_title = new TextEncoder().encode(title);
        const b_title_length = decToBytes(b_title.length, 4);
        const b_maxTxnSize = decToBytes(maxTxnSize, 4);
        const b_description = new TextEncoder().encode(description);

        const txnBytes = new Uint8Array([
            ...base,
            ...b_title_length,
            ...b_title,
            ...b_maxTxnSize,
            ...b_description,
        ]);

        return txnBytes;
    }

    static getChangeOverallBurnPercentageProposalTxn(
        burnPercentage: number,
        title: string,
        description: string,
        nonce: number,
        chainId: number
    ) {
        const base = this.getTransactionBase(
            Transaction_ID.CHANGE_OVERALL_BURN_PERCENTAGE_PROPOSAL,
            chainId,
            nonce
        );

        /*
        Identifier - 1
        chain id - 1
        nonce - 4
        title size identifier - 4
        title - x
        burn percentage - 4
        description - x
        signature - 65
        */

        const b_title = new TextEncoder().encode(title);
        const b_title_length = decToBytes(b_title.length, 4);
        const b_burnPercentage = decToBytes(burnPercentage, 4);
        const b_description = new TextEncoder().encode(description);

        const txnBytes = new Uint8Array([
            ...base,
            ...b_title_length,
            ...b_title,
            ...b_burnPercentage,
            ...b_description,
        ]);

        return txnBytes;
    }

    static getChangeRewardPerYearProposalTxn(
        rewardPerYear: string,
        title: string,
        description: string,
        nonce: number,
        chainId: number
    ) {
        const base = this.getTransactionBase(
            Transaction_ID.CHANGE_REWARD_PER_YEAR_PROPOSAL_TXN,
            chainId,
            nonce
        );

        /*
        Identifier - 1
        chain id - 1
        nonce - 4
        title size identifier - 4
        title - x
        reward per year - 8
        description - x
        signature - 65
        */

        const b_title = new TextEncoder().encode(title);
        const b_title_length = decToBytes(b_title.length, 4);
        const b_reward = BnToBytes(new BigNumber(rewardPerYear));
        const b_description = new TextEncoder().encode(description);

        const txnBytes = new Uint8Array([
            ...base,
            ...b_title_length,
            ...b_title,
            ...b_reward,
            ...b_description,
        ]);

        return txnBytes;
    }

    static getChangeValidatorCountLimitProposalTxn(
        validatorCountLimit: number,
        title: string,
        description: string,
        nonce: number,
        chainId: number
    ) {
        const base = this.getTransactionBase(
            Transaction_ID.CHANGE_VALIDATOR_COUNT_LIMIT_PROPOSAL,
            chainId,
            nonce
        );

        /*
        Identifier - 1
        chain id - 1
        nonce - 4
        title size identifier - 4
        title - x
        validator count limit - 4
        description - x
        signature - 65
        */

        const b_title = new TextEncoder().encode(title);
        const b_title_length = decToBytes(b_title.length, 4);
        const b_validatorCountLimit = decToBytes(validatorCountLimit, 4);
        const b_description = new TextEncoder().encode(description);

        const txnBytes = new Uint8Array([
            ...base,
            ...b_title_length,
            ...b_title,
            ...b_validatorCountLimit,
            ...b_description,
        ]);

        return txnBytes;
    }

    static getChangeValidatorJoiningFeeProposalTxn(
        joiningFee: string,
        title: string,
        description: string,
        nonce: number,
        chainId: number
    ) {
        const base = this.getTransactionBase(
            Transaction_ID.CHANGE_VALIDATOR_JOINING_FEE_PROPOSAL,
            chainId,
            nonce
        );

        /*
        Identifier - 1
        chain id - 1
        nonce - 4
        title size identifier - 4
        title - x
        joining fee - 8
        description - x
        signature - 65
        */

        const b_title = new TextEncoder().encode(title);
        const b_title_length = decToBytes(b_title.length, 4);
        const b_joiningFee = BnToBytes(new BigNumber(joiningFee));
        const b_description = new TextEncoder().encode(description);

        const txnBytes = new Uint8Array([
            ...base,
            ...b_title_length,
            ...b_title,
            ...b_joiningFee,
            ...b_description,
        ]);

        return txnBytes;
    }

    static getChangeVmIdClaimingFeeProposalTxn(
        claimingFee: string,
        title: string,
        description: string,
        nonce: number,
        chainId: number
    ) {
        const base = this.getTransactionBase(
            Transaction_ID.CHANGE_VM_ID_CLAIMING_FEE_PROPOSAL,
            chainId,
            nonce
        );

        /*
        Identifier - 1
        chain id - 1
        nonce - 4
        title size identifier - 4
        title - x
        vm id claiming fee - 8
        description - x
        signature - 65
        */

        const b_title = new TextEncoder().encode(title);
        const b_title_length = decToBytes(b_title.length, 4);
        const b_claimingFee = BnToBytes(new BigNumber(claimingFee));
        const b_description = new TextEncoder().encode(description);

        const txnBytes = new Uint8Array([
            ...base,
            ...b_title_length,
            ...b_title,
            ...b_claimingFee,
            ...b_description,
        ]);

        return txnBytes;
    }

    static getChangeVmOwnerTxnFeeShareProposalTxn(
        feeShare: number,
        title: string,
        description: string,
        nonce: number,
        chainId: number
    ) {
        const base = this.getTransactionBase(
            Transaction_ID.CHANGE_VM_OWNER_TXN_FEE_SHARE_PROPOSAL,
            chainId,
            nonce
        );

        /*
        Identifier - 1
        chain id - 1
        nonce - 4
        title size identifier - 4
        title - x
        vm owner txn fee share - 4
        description - x
        signature - 65
        */

        const b_title = new TextEncoder().encode(title);
        const b_title_length = decToBytes(b_title.length, 4);
        const b_feeShare = decToBytes(feeShare, 4);
        const b_description = new TextEncoder().encode(description);

        const txnBytes = new Uint8Array([
            ...base,
            ...b_title_length,
            ...b_title,
            ...b_feeShare,
            ...b_description,
        ]);

        return txnBytes;
    }

    static getOtherProposalTxn(
        title: string,
        description: string,
        nonce: number,
        chainId: number
    ) {
        const base = this.getTransactionBase(
            Transaction_ID.OTHER_PROPOSAL_TXN,
            chainId,
            nonce
        );

        /*
        Identifier - 1
        chain id - 1
        nonce - 4
        title size identifier - 4
        title - x
        description - x
        signature - 65
        */

        const b_title = new TextEncoder().encode(title);
        const b_title_length = decToBytes(b_title.length, 4);
        const b_description = new TextEncoder().encode(description);

        const txnBytes = new Uint8Array([
            ...base,
            ...b_title_length,
            ...b_title,
            ...b_description,
        ]);

        return txnBytes;
    }

    static getVoteOnProposalTxn(
        proposalHash: string,
        vote: number,
        nonce: number,
        chainId: number
    ) {
        const base = this.getTransactionBase(
            Transaction_ID.VOTE_ON_PROPOSAL_TXN,
            chainId,
            nonce
        );

        /*
        Identifier - 1
        chain id - 1
        nonce - 4
        proposal hash - 32
        vote - 1
        signature - 65
        */

        const b_proposalHash = HexToBytes(proposalHash);
        const b_vote = decToBytes(vote, 1);

        const txnBytes = new Uint8Array([
            ...base,
            ...b_proposalHash,
            ...b_vote,
        ]);

        return txnBytes;
    }

    // #endregion
}
