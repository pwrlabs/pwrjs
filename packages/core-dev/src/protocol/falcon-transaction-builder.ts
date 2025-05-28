import { Transaction_ID } from '../static/enums/transaction.enum';
import { bigintToBytesDynamic } from '../utils';
import { BigNumber } from 'bignumber.js';
import { bytesToHex } from '../utils';

function assetAddressValidity(to: string): void {
    if (to.length !== 40) {
        throw new Error('Invalid address format');
    }
}

export default class FalconTransactionBuilder {
    // #region - falcon transactions

    // prettier-ignore
    private static getFalconTransactionBase(id: Transaction_ID, nonce: number, chainId: number, feePerByte: bigint, sender: Uint8Array): Uint8Array {
        const buffer = new Uint8Array(37);
        const view = new DataView(buffer.buffer);

        const feePerByteBN = BigNumber(feePerByte.toString());

        if (feePerByteBN.comparedTo(0) < 0) {
            throw new Error('Fee cannot be negative');
        }

        let offset = 0;
        view.setInt32(offset, id);
        offset += 4;
        view.setUint8(offset, chainId);
        offset += 1;
        view.setInt32(offset, nonce);
        offset += 4;
        view.setBigUint64(offset, feePerByte, false);
        offset += 8;
        buffer.set(sender, offset);
        offset += 20;

        const byteArray = new Uint8Array(buffer);

        return byteArray;
    }

    // prettier-ignore
    static getSetPublicKeyTransaction(publicKey: Uint8Array, nonce: number, chainId: number, sender: Uint8Array, feePerByte: bigint): Uint8Array {
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_SET_PUBLIC_KEY,
            nonce,
            chainId,
            feePerByte,
            sender,
        );

        const buffer = new Uint8Array(base.length + 2 + publicKey.length);

        const dataView = new DataView(buffer.buffer);

        let offset = 0;
        buffer.set(base, offset);
        offset += base.length;

        dataView.setUint16(offset, publicKey.length, false);
        offset += 2;

        buffer.set(publicKey, offset);
        offset += publicKey.length;

        return buffer;
    }

    // prettier-ignore
    static getJoinAsValidatorTransaction(ip: string, sender: Uint8Array, nonce: number, chainId: number, feePerByte: bigint): Uint8Array {
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_JOIN_AS_VALIDATOR,
            nonce,
            chainId,
            feePerByte,
            sender,
        );

        const ipBytes = new Uint8Array(Buffer.from(ip, 'utf-8'));

        const buffer = new Uint8Array(base.length + 2 + ipBytes.length);
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        dataView.setUint16(offset, ipBytes.length, false);
        offset += 2;

        buffer.set(ipBytes, offset);
        offset += ipBytes.length;

        return buffer;
    }

    // prettier-ignore
    static getDelegateTransaction(validator: Uint8Array, pwrAmount: bigint, nonce: number, chainId: number, sender: Uint8Array, feePerByte: bigint): Uint8Array {
        assetAddressValidity(bytesToHex(validator));

        const amountBN = BigNumber(pwrAmount.toString());

        if (amountBN.comparedTo(0) < 0) {
            throw new Error('Amount cannot be negative');
        }
        if (nonce < 0) {
            throw new Error('Nonce cannot be negative');
        }

        // const validatorBytes = hexToBytes(validator.substring(2));

        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_DELEGATE,
            nonce,
            chainId,
            feePerByte,
            sender,
        );

        const buffer = new Uint8Array(base.length + 20 + 8);
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;
        
        buffer.set(validator, offset);
        offset += 20;
        
        dataView.setBigUint64(offset, pwrAmount, false);
        offset += 8;

        return buffer;
    }

    // prettier-ignore
    static getFalconChangeIpTransaction(feePerByte: bigint, sender: Uint8Array, newIp: string, nonce: number, chainId: number): Uint8Array {
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_CHANGE_IP,
            nonce,
            chainId,
            feePerByte,
            sender,
        );

        const enconder = new TextEncoder();
        const newIpBytes = enconder.encode(newIp);

        const totalLength = base.length + 2 + newIpBytes.length;
        const buffer = new Uint8Array(totalLength);
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        dataView.setUint16(offset, newIpBytes.length, false);
        offset += 2;

        buffer.set(newIpBytes, offset);
        offset += newIpBytes.length;

        return buffer;
    }

    // prettier-ignore
    static getClaimActiveNodeSpotTransaction(feePerByte: bigint, sender: Uint8Array, nonce: number, chainId: number): Uint8Array {
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_ACTIVE_NODE_SPOT,
            nonce,
            chainId,
            feePerByte,
            sender,
        );

        return base;
    }

    // prettier-ignore
    static getTransferTransaction(feePerByte: bigint, sender: Uint8Array, receiver: Uint8Array, amount: bigint, nonce: number, chainId: number): Uint8Array {
        assetAddressValidity(bytesToHex(receiver));

        const amountBN = BigNumber(amount.toString());

        if (amountBN.comparedTo(0) < 0) {
            throw new Error('Amount cannot be negative');
        }
        if (nonce < 0) {
            throw new Error('Nonce cannot be negative');
        }

        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_TRANSFER,
            nonce,
            chainId,
            feePerByte,
            sender,
        );

        const buffer = new Uint8Array(base.length + 20 + 8);
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;
        
        buffer.set(receiver, offset);
        offset += 20;
        
        dataView.setBigUint64(offset, amount, false);
        offset += 8;

        return buffer;
    }

    // #region proposal transactions

    // prettier-ignore
    static getChangeEarlyWithdrawPenaltyProposalTransaction(feePerByte: bigint, sender: Uint8Array, title: string, description: string, earlyWithdrawalTime: bigint, withdrawalPenalty: number, nonce: number, chainId: number): Uint8Array {

        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_CHANGE_EARLY_WITHDRAW_PENALTY_PROPOSAL,
            nonce,
            chainId,
            feePerByte,
            sender,
        )

        const titleBytes = new TextEncoder().encode(title);
        const descriptionBytes = new TextEncoder().encode(description);

        const buffer = new Uint8Array(base.length + 4 + titleBytes.length + 8 + 4 + descriptionBytes.length);
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        dataView.setUint32(offset, titleBytes.length, false);
        offset += 4;

        buffer.set(titleBytes, offset);
        offset += titleBytes.length;

        dataView.setBigUint64(offset, BigInt(earlyWithdrawalTime), false);
        offset += 8;

        dataView.setUint32(offset, withdrawalPenalty, false);
        offset += 4;

        buffer.set(descriptionBytes, offset);
        offset += descriptionBytes.length;

        return buffer; 
    }

    // prettier-ignore
    static getChangeFeePerByteProposalTransaction(feePerByte: bigint, sender: Uint8Array, title: string, description: string, newFeePerByte: bigint, nonce: number, chainId: number): Uint8Array {
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_CHANGE_FEE_PER_BYTE_PROPOSAL,
            nonce,
            chainId,
            feePerByte,
            sender,
        );

        const titleBytes = new TextEncoder().encode(title);
        const descriptionBytes = new TextEncoder().encode(description);

        const buffer = new Uint8Array(base.length + 4 + titleBytes.length + 8 + 4 + descriptionBytes.length);
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        dataView.setUint32(offset, titleBytes.length, false);
        offset += 4;

        buffer.set(titleBytes, offset);
        offset += titleBytes.length;

        dataView.setBigUint64(offset, newFeePerByte, false);
        offset += 8;

        buffer.set(descriptionBytes, offset);
        offset += descriptionBytes.length;

        return buffer;
    }

    static getChangeMaxBlockSizeProposalTransaction(
        feePerByte: bigint,
        sender: Uint8Array,
        title: string,
        description: string,
        newMaxBlockSize: bigint,
        nonce: number,
        chainId: number
    ): Uint8Array {
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_CHANGE_MAX_BLOCK_SIZE_PROPOSAL,
            nonce,
            chainId,
            feePerByte,
            sender
        );

        const titleBytes = new TextEncoder().encode(title);
        const descriptionBytes = new TextEncoder().encode(description);

        const buffer = new Uint8Array(
            base.length + 4 + titleBytes.length + 4 + descriptionBytes.length
        );
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        dataView.setUint32(offset, titleBytes.length, false);
        offset += 4;

        buffer.set(titleBytes, offset);
        offset += titleBytes.length;

        dataView.setBigUint64(offset, newMaxBlockSize, false);
        offset += 8;

        buffer.set(descriptionBytes, offset);
        offset += descriptionBytes.length;

        return buffer;
    }

    static getChangeMaxTxnSizeProposalTransaction(
        feePerByte: bigint,
        sender: Uint8Array,
        title: string,
        description: string,
        newMaxTxnSize: bigint,
        nonce: number,
        chainId: number
    ): Uint8Array {
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_CHANGE_MAX_TXN_SIZE_PROPOSAL,
            nonce,
            chainId,
            feePerByte,
            sender
        );

        const titleBytes = new TextEncoder().encode(title);
        const descriptionBytes = new TextEncoder().encode(description);

        const buffer = new Uint8Array(
            base.length + 4 + titleBytes.length + 4 + descriptionBytes.length
        );

        const dataView = new DataView(buffer.buffer);

        let offset = 0;
        buffer.set(base, offset);
        offset += base.length;

        dataView.setUint32(offset, titleBytes.length, false);
        offset += 4;

        buffer.set(titleBytes, offset);
        offset += titleBytes.length;

        dataView.setBigUint64(offset, newMaxTxnSize, false);
        offset += 8;

        buffer.set(descriptionBytes, offset);
        offset += descriptionBytes.length;

        return buffer;
    }

    // prettier-ignore
    static getChangeOverallBurnPercentageProposalTransaction(feePerByte: bigint, sender: Uint8Array, title: string, description: string, burnPercentage: number, nonce: number, chainId: number): Uint8Array {
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_CHANGE_OVERALL_BURN_PERCENTAGE_PROPOSAL,
            nonce,
            chainId,
            feePerByte,
            sender
        );

        const titleBytes = new TextEncoder().encode(title);
        const descriptionBytes = new TextEncoder().encode(description);

        const buffer = new Uint8Array(
            base.length + 4 + titleBytes.length + 4 + descriptionBytes.length
        );
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        dataView.setUint32(offset, titleBytes.length, false);
        offset += 4;

        buffer.set(titleBytes, offset);
        offset += titleBytes.length;

        dataView.setUint32(offset, burnPercentage, false);
        offset += 4;

        buffer.set(descriptionBytes, offset);
        offset += descriptionBytes.length;

        return buffer;
    }

    // prettier-ignore
    static getChangeRewardPerYearProposalTransaction(feePerByte: bigint, sender: Uint8Array, title: string, description: string, rewardPerYear: bigint, nonce: number, chainId: number): Uint8Array {
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_CHANGE_REWARD_PER_YEAR_PROPOSAL,
            nonce,
            chainId,
            feePerByte,
            sender
        );

        const titleBytes = new TextEncoder().encode(title);
        const descriptionBytes = new TextEncoder().encode(description);

        const buffer = new Uint8Array(
            base.length + 4 + titleBytes.length + 8 + descriptionBytes.length
        );

        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        dataView.setUint32(offset, titleBytes.length, false);
        offset += 4;

        buffer.set(titleBytes, offset);
        offset += titleBytes.length;

        dataView.setBigUint64(offset, rewardPerYear, false);
        offset += 8;

        buffer.set(descriptionBytes, offset);
        offset += descriptionBytes.length;

        return buffer;
    }

    // prettier-ignore
    static getChangeValidatorCountLimitProposalTransaction(feePerByte: bigint, sender: Uint8Array, title: string, description: string, validatorCountLimit: number, nonce: number, chainId: number): Uint8Array {
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_CHANGE_VALIDATOR_COUNT_LIMIT_PROPOSAL,
            nonce,
            chainId,
            feePerByte,
            sender
        );

        const titleBytes = new TextEncoder().encode(title);
        const descriptionBytes = new TextEncoder().encode(description);

        const buffer = new Uint8Array(
            base.length + 4 + titleBytes.length + 4 + descriptionBytes.length
        );

        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        dataView.setUint32(offset, titleBytes.length, false);
        offset += 4;

        buffer.set(titleBytes, offset);
        offset += titleBytes.length;

        dataView.setUint32(offset, validatorCountLimit, false);
        offset += 4;

        buffer.set(descriptionBytes, offset);
        offset += descriptionBytes.length;

        return buffer;
    }

    // prettier-ignore
    static getChangeValidatorJoiningFeeProposalTransaction(feePerByte: bigint, sender: Uint8Array, title: string, description: string, joiningFee: bigint, nonce: number, chainId: number): Uint8Array {
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_CHANGE_VALIDATOR_JOINING_FEE_PROPOSAL,
            nonce,
            chainId,
            feePerByte,
            sender
        );

        const titleBytes = new TextEncoder().encode(title);
        const descriptionBytes = new TextEncoder().encode(description);

        const buffer = new Uint8Array(
            base.length + 4 + titleBytes.length + 8 + descriptionBytes.length
        );
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        dataView.setUint32(offset, titleBytes.length, false);
        offset += 4;

        buffer.set(titleBytes, offset);
        offset += titleBytes.length;

        dataView.setBigUint64(offset, joiningFee, false);
        offset += 8;

        buffer.set(descriptionBytes, offset);
        offset += descriptionBytes.length;

        return buffer;
    }

    // prettier-ignore
    static getChangeVidaIdClaimingFeeProposalTransaction(feePerByte: bigint, sender: Uint8Array, title: string, description: string, vidaIdClaimingFee: bigint, nonce: number, chainId: number): Uint8Array {
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_CHANGE_VIDA_ID_CLAIMING_FEE_PROPOSAL,
            nonce,
            chainId,
            feePerByte,
            sender
        );

        const titleBytes = new TextEncoder().encode(title);
        const descriptionBytes = new TextEncoder().encode(description);

        const buffer = new Uint8Array(
            base.length + 4 + titleBytes.length + 8 + descriptionBytes.length
        );
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        dataView.setUint32(offset, titleBytes.length, false);
        offset += 4;

        buffer.set(titleBytes, offset);
        offset += titleBytes.length;

        dataView.setBigUint64(offset, vidaIdClaimingFee, false);
        offset += 8;

        buffer.set(descriptionBytes, offset);
        offset += descriptionBytes.length;

        return buffer;
    }

    // prettier-ignore
    static getChangeVmOwnerTxnFeeShareProposalTransaction(feePerByte: bigint, sender: Uint8Array, title: string, description: string, vmOwnerTxnFeeShare: number, nonce: number, chainId: number): Uint8Array {
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_CHANGE_VM_OWNER_TXN_FEE_SHARE_PROPOSAL,
            nonce,
            chainId,
            feePerByte,
            sender
        );

        const titleBytes = new TextEncoder().encode(title);
        const descriptionBytes = new TextEncoder().encode(description);

        const buffer = new Uint8Array(
            base.length + 4 + titleBytes.length + 4 + descriptionBytes.length
        );
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        dataView.setUint32(offset, titleBytes.length, false);
        offset += 4;

        buffer.set(titleBytes, offset);
        offset += titleBytes.length;

        dataView.setUint32(offset, vmOwnerTxnFeeShare, false);
        offset += 4;

        buffer.set(descriptionBytes, offset);
        offset += descriptionBytes.length;

        return buffer;
    }

    // prettier-ignore
    static getOtherProposalTransaction(feePerByte: bigint, sender: Uint8Array, title: string, description: string, nonce: number, chainId: number): Uint8Array {
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_OTHER_PROPOSAL,
            nonce,
            chainId,
            feePerByte,
            sender
        );

        const titleBytes = new TextEncoder().encode(title);
        const descriptionBytes = new TextEncoder().encode(description);

        const buffer = new Uint8Array(
            base.length + 4 + titleBytes.length + descriptionBytes.length
        );
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        dataView.setUint32(offset, titleBytes.length, false);
        offset += 4;

        buffer.set(titleBytes, offset);
        offset += titleBytes.length;

        buffer.set(descriptionBytes, offset);
        offset += descriptionBytes.length;

        return buffer;
    }

    // prettier-ignore
    static getVoteOnProposalTransaction(feePerByte: bigint, sender: Uint8Array, proposalHash: Uint8Array, vote: number, nonce: number, chainId: number): Uint8Array {
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_VOTE_ON_PROPOSAL,
            nonce,
            chainId,
            feePerByte,
            sender
        );

        const buffer = new Uint8Array(base.length + 32 + 1);
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        buffer.set(proposalHash, offset);
        offset += 32;

        dataView.setUint8(offset, vote);
        offset += 1;

        return buffer;
    }

    // #endregion

    // #region guardian

    // prettier-ignore
    static getGuardianApprovalTransaction(feePerByte: bigint, sender: Uint8Array, wrappedTxns: Uint8Array[], nonce: number, chainId: number): Uint8Array {
        
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_GUARDIAN_APPROVAL,
            nonce,
            chainId,
            feePerByte,
            sender
        );

        // Calculate size needed for all wrapped transactions
        let totalWrappedSize = 0;
        for (const wrappedTxn of wrappedTxns) {
            totalWrappedSize += 4 + wrappedTxn.length; // 4 bytes for length + txn size
        }

        const buffer = new Uint8Array(4 + base.length + totalWrappedSize);
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        dataView.setUint32(offset, wrappedTxns.length, false);
        offset += 4;

        for (const wrappedTxn of wrappedTxns) {
            dataView.setUint32(offset, wrappedTxn.length, false);
            offset += 4;
            buffer.set(wrappedTxn, offset);
            offset += wrappedTxn.length;
        }

        return buffer;
    }

    // prettier-ignore
    static getRemoveGuardianTransaction(feePerByte: bigint, sender: Uint8Array, nonce: number, chainId: number): Uint8Array {
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_REMOVE_GUARDIAN,
            nonce,
            chainId,
            feePerByte,
            sender
        );

        return base;
    }

    // prettier-ignore
    static getSetGuardianTransaction(feePerByte: bigint, sender: Uint8Array, expiryDate: EpochTimeStamp, guardianAddress: Uint8Array, nonce: number, chainId: number): Uint8Array {

        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_SET_GUARDIAN,
            nonce,
            chainId,
            feePerByte,
            sender
        );

        const buffer = new Uint8Array(base.length + 8 + 20);
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        dataView.setBigUint64(offset, BigInt(expiryDate), false);
        offset += 8;

        buffer.set(guardianAddress, offset);
        offset += 20;

        return buffer;
    }

    // #endregion

    // #region validator
    // prettier-ignore
    static getMoveStakeTxnTransaction(feePerByte: bigint, sender: Uint8Array, sharesAmount: bigint, fromValidator: Uint8Array, toValidator: Uint8Array, nonce: number, chainId: number): Uint8Array {
        throw new Error('Method not implemented.');
    }

    // prettier-ignore
    static getRemoveValidatorTransaction(feePerByte: bigint, sender: Uint8Array, validatorAddress: Uint8Array, nonce: number, chainId: number): Uint8Array {
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_REMOVE_VALIDATOR,
            nonce,
            chainId,
            feePerByte,
            sender
        );

        const buffer = new Uint8Array(base.length + 20);
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        buffer.set(validatorAddress, offset);
        offset += 20;

        return buffer;
    }

    // prettier-ignore
    static getWithdrawTransaction(feePerByte: bigint, sender: Uint8Array, sharesAmount: bigint, validator: Uint8Array, nonce: number, chainId: number): Uint8Array {
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_WITHDRAW,
            nonce,
            chainId,
            feePerByte,
            sender
        );

        const sharesAmountBytes = bigintToBytesDynamic(sharesAmount);

        const buffer = new Uint8Array(base.length + 2 + sharesAmountBytes.length + 20);
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        dataView.setUint16(offset, sharesAmountBytes.length, false);
        offset += 2;

        buffer.set(sharesAmountBytes, offset);
        offset += sharesAmountBytes.length;

        buffer.set(validator, offset);
        offset += 20;

        return buffer;
    }

    // #endregion

    // #region vida transactions

    // prettier-ignore
    static getClaimVidaIdTransaction(feePerByte: bigint, sender: Uint8Array, vidaId: bigint, nonce: number, chainId: number): Uint8Array {

        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_CLAIM_VIDA_ID,
            nonce,
            chainId,
            feePerByte,
            sender
        );


        const buffer = new Uint8Array(base.length + 8);
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        dataView.setBigUint64(offset, vidaId, false);
        offset += 8;

        return buffer;

    }

    // prettier-ignore
    static getPayableVidaDataTransaction(feePerByte: bigint, sender: Uint8Array, vidaId: bigint, data: Uint8Array, value: bigint, nonce: number, chainId: number): Uint8Array {

        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_PAYABLE_VIDA_DATA,
            nonce,
            chainId,
            feePerByte,
            sender
        );

        const buffer = new Uint8Array(base.length + 8 + 4 + data.length + 8);
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        dataView.setBigUint64(offset, vidaId, false);
        offset += 8;

        dataView.setUint32(offset, data.length, false);
        offset += 4;

        buffer.set(data, offset);
        offset += data.length;

        dataView.setBigUint64(offset, value, false);
        offset += 8;

        return buffer;
    }

    // prettier-ignore
    static getSetVidaPrivateStateTransaction(feePerByte: bigint, sender: Uint8Array, vidaId: bigint, privateState: boolean, nonce: number, chainId: number): Uint8Array {
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_SET_VIDA_PRIVATE_STATE,
            nonce,
            chainId,
            feePerByte,
            sender
        );

        const buffer = new Uint8Array(base.length + 8 + 1);
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        dataView.setBigUint64(offset, vidaId, false);
        offset += 8;

        dataView.setUint8(offset, privateState ? 1 : 0);
        offset += 1;

        return buffer;
    }

    // prettier-ignore
    static getSetVidaToAbsolutePublicTransaction(feePerByte: bigint, sender: Uint8Array, vidaId: bigint, nonce: number, chainId: number): Uint8Array {
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_SET_VIDA_TO_ABSOLUTE_PUBLIC,
            nonce,
            chainId,
            feePerByte,
            sender
        );

        const buffer = new Uint8Array(base.length + 8);
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        dataView.setBigUint64(offset, vidaId, false);
        offset += 8;

        return buffer;
    }

    // prettier-ignore
    static getAddVidaSponsoredAddressesTransaction(feePerByte: bigint, sender: Uint8Array, vidaId: bigint, sponsoredAddresses: Set<Uint8Array>, nonce: number, chainId: number): Uint8Array {
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_ADD_VIDA_SPONSORED_ADDRESSES,
            nonce,
            chainId,
            feePerByte,
            sender
        );

        // Calculate total size needed: base + vidaId(8) + (sponsoredAddresses * 20)
        const totalSize = base.length + 8 + sponsoredAddresses.size * 20;

        const buffer = new Uint8Array(totalSize);
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        dataView.setBigUint64(offset, vidaId, false);
        offset += 8;

        // Add each sponsored address
        for (const sponsoredAddress of sponsoredAddresses) {
            buffer.set(sponsoredAddress, offset);
            offset += 20;
        }

        return buffer;
    }

    // prettier-ignore
    static getAddVidaAllowedSendersTransaction(feePerByte: bigint, sender: Uint8Array, vidaId: bigint, allowedSenders: Set<Uint8Array>, nonce: number, chainId: number): Uint8Array {
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_ADD_VIDA_ALLOWED_SENDERS,
            nonce,
            chainId,
            feePerByte,
            sender
        );

        // Calculate total size needed: base + vidaId(8) + (allowedSenders * 20)
        const totalSize = base.length + 8 + (allowedSenders.size * 20);

        const buffer = new Uint8Array(totalSize);
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        dataView.setBigUint64(offset, vidaId, false);
        offset += 8;

        // Add each allowed sender address
        for (const allowedSender of allowedSenders) {
            buffer.set(allowedSender, offset);
            offset += 20;
        }

        return buffer;
    }

    // prettier-ignore
    static getRemoveVidaAllowedSendersTransaction(feePerByte: bigint, sender: Uint8Array, vidaId: bigint, allowedSenders: Set<Uint8Array>, nonce: number, chainId: number): Uint8Array {
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_REMOVE_VIDA_ALLOWED_SENDERS,
            nonce,
            chainId,
            feePerByte,
            sender
        );

        // Calculate total size needed: base + vidaId(8) + (allowedSenders * 20)
        const totalSize = base.length + 8 + (allowedSenders.size * 20);

        const buffer = new Uint8Array(totalSize);
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        dataView.setBigUint64(offset, vidaId, false);
        offset += 8;

        // Add each allowed sender address
        for (const allowedSender of allowedSenders) {
            buffer.set(allowedSender, offset);
            offset += 20;
        }

        return buffer;
    }

    // #endregion

    // #region conduits transactions

    // prettier-ignore
    static getConduitApprovalTransaction(feePerByte: bigint, sender: Uint8Array, vidaId: bigint, wrappedTxns: Uint8Array[], nonce: number, chainId: number): Uint8Array {
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_CONDUITS_APPROVAL,
            nonce,
            chainId,
            feePerByte,
            sender
        );

        // Calculate size needed for all wrapped transactions
        let totalWrappedSize = 8; // 8 bytes for vidaId
        for (const wrappedTxn of wrappedTxns) {
            totalWrappedSize += 4 + wrappedTxn.length; // 4 bytes for length + txn size
        }

        const buffer = new Uint8Array(base.length + 4 + totalWrappedSize);
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        // add vida ID
        dataView.setBigUint64(offset, vidaId, false);
        offset += 8;

        // add number of wrapped transactions
        dataView.setUint32(offset, wrappedTxns.length, false);
        offset += 4;

        for (const wrappedTxn of wrappedTxns) {
            dataView.setUint32(offset, wrappedTxn.length, false);
            offset += 4;
            buffer.set(wrappedTxn, offset);
            offset += wrappedTxn.length;
        }

        return buffer;
    }

    // prettier-ignore
    static getRemoveConduitsTransaction(feePerByte: bigint, sender: Uint8Array, vidaId: bigint, conduits: Uint8Array[], nonce: number, chainId: number): Uint8Array {
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_REMOVE_CONDUITS,
            nonce,
            chainId,
            feePerByte,
            sender
        );

        const buffer = new Uint8Array(base.length + 8 + conduits.length * 20);
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        // add vida ID
        dataView.setBigUint64(offset, vidaId, false);
        offset += 8;

        // add each conduit address
        for (const conduit of conduits) {
            buffer.set(conduit, offset);
            offset += 20;
        }

        return buffer;
    }

    // prettier-ignore
    static getConduitModeTransaction(feePerByte: bigint, sender: Uint8Array, vidaId: bigint, mode: number, conduitThreshold: number, conduits: Set<Uint8Array>, conduitsWithVotingPower: Map<Uint8Array, bigint>, nonce: number, chainId: number): Uint8Array {
        if (conduits && conduitsWithVotingPower) {
            throw new Error(
                'Conduits and conduitsWithVotingPower cannot both be sent in the same txn'
            );
        }

        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_CONDUIT_MODE,
            nonce,
            chainId,
            feePerByte,
            sender
        );

        let totalSize = base.length + 8 + 1 + 4; // base + vidaId(8) + mode(1) + threshold(4)
        totalSize += conduits ? conduits.size * 20 : 0; // conduits * 20 bytes each
        totalSize += conduitsWithVotingPower ? conduitsWithVotingPower.size * 28 : 0; // conduitsWithVotingPower * (20 + 8) bytes each

        const buffer = new Uint8Array(totalSize);
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        // add vida ID
        dataView.setBigUint64(offset, vidaId, false);
        offset += 8;

        // add mode
        dataView.setUint8(offset, mode);
        offset += 1;

        // add conduit threshold
        dataView.setUint32(offset, conduitThreshold, false);
        offset += 4;

        // add conduits if provided

        if (conduits) {
            dataView.setUint32(offset, conduits.size, false);
            offset += 4;
            for (const conduit of conduits) {
                buffer.set(conduit, offset);
                offset += 20;
            }
        }

        if (conduitsWithVotingPower) {
            dataView.setUint32(offset, conduitsWithVotingPower.size, false);
            offset += 4;
            for (const [conduit, votingPower] of conduitsWithVotingPower.entries()) {
                buffer.set(conduit, offset);
                offset += 20;
                dataView.setBigUint64(offset, votingPower, false);
                offset += 8;
            }
        }

        if (!conduits && !conduitsWithVotingPower) {
            dataView.setUint32(offset, 0, false);
            offset += 4;
        }

        return buffer;
    }

    // prettier-ignore
    static getSetConduitModeWithVidaBasedTransaction(feePerByte: bigint, sender: Uint8Array, vidaId: bigint, mode: number, conduitThreshold: number, conduits: Uint8Array[], stakingPowers: bigint[], nonce: number, chainId: number): Uint8Array { 
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_SET_CONDUIT_MODE_WITH_VIDA_BASED,
            nonce,
            chainId,
            feePerByte,
            sender
        );

        // Calculate size: base + vidaId(8) + mode(1) + threshold(4) + (conduits * (20+8))
        let totalSize = base.length + 8 + 1 + 4;
        totalSize += conduits != null ? conduits.length * 28 : 0; // 20 bytes address + 8 bytes staking power

        const buffer = new Uint8Array(totalSize);
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        // add vida ID
        dataView.setBigUint64(offset, vidaId, false);
        offset += 8;

        // add mode
        dataView.setUint8(offset, mode);
        offset += 1;

        // add conduit threshold
        dataView.setUint32(offset, conduitThreshold, false);
        offset += 4;

        // Add conduit addresses and staking powers if provided
        if (conduits != null && stakingPowers != null && conduits.length === stakingPowers.length) {
            for (let i = 0; i < conduits.length; i++) {
                buffer.set(conduits[i], offset);
                offset += 20;
                dataView.setBigUint64(offset, stakingPowers[i], false);
                offset += 8;
            }
        }

        return buffer;
    }

    // #endregion

    // #region others

    // prettier-ignore
    static getRemoveSponsoredAddressesTransaction(feePerByte: bigint, sender: Uint8Array, vidaId: bigint, sponsoredAddresses: Set<Uint8Array>, nonce: number, chainId: number): Uint8Array {
        
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_REMOVE_SPONSORED_ADDRESSES,
            nonce,
            chainId,
            feePerByte,
            sender
        );

        // Calculate total size needed: base + vidaId(8) + (sponsoredAddresses * 20)
        const totalSize = base.length + 8 + (sponsoredAddresses.size * 20);
        const buffer = new Uint8Array(totalSize);
        const dataView = new DataView(buffer.buffer);

        let offset = 0;
        buffer.set(base, offset);
        offset += base.length;

        dataView.setBigUint64(offset, vidaId, false);
        offset += 8;

        // Add each sponsored address to remove
        for (const sponsoredAddress of sponsoredAddresses) {
            buffer.set(sponsoredAddress, offset);
            offset += 20;
        }

        return buffer;
    }

    // prettier-ignore
    static getSetPWRTransferRightsTransaction(feePerByte: bigint, sender: Uint8Array, vidaId: bigint, ownerCanTransferPWR: boolean, nonce: number, chainId: number): Uint8Array {
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_SET_PWR_TRANSFER_RIGHTS,
            nonce,
            chainId,
            feePerByte,
            sender
        );

        const buffer = new Uint8Array(base.length + 8 + 1 + 1);
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        dataView.setBigUint64(offset, vidaId);
        offset += 8;

        dataView.setUint8(offset, ownerCanTransferPWR ? 1 : 0);
        offset += 1;

        return buffer;
    }

    // prettier-ignore
    static getTransferPWRFromVidaTransaction(feePerByte: bigint, sender: Uint8Array, vidaId: bigint, receiver: Uint8Array, amount: bigint, nonce: number, chainId: number): Uint8Array {
        const base = this.getFalconTransactionBase(
            Transaction_ID.FALCON_TRANSFER_PWR_FROM_VIDA,
            nonce,
            chainId,
            feePerByte,
            sender
        );

        const buffer = new Uint8Array(base.length + 8 + 20 + 8);
        const dataView = new DataView(buffer.buffer);
        let offset = 0;

        buffer.set(base, offset);
        offset += base.length;

        dataView.setBigUint64(offset, vidaId, false);
        offset += 8;

        buffer.set(receiver, offset);
        offset += 20;

        dataView.setBigUint64(offset, amount, false);
        offset += 8;

        return buffer;
    }

    // #endregion
}
