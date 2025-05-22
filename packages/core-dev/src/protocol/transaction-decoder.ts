import { Log, ethers } from 'ethers';
import { Transaction } from '../record/transaction';
import { Transaction_ID } from '../static/enums/transaction.enum';
import PWRJS from './pwrjs';

import { hexToBytes, bytesToHex } from '../utils';
// import ethUtil from 'ethereumjs-util';

export default class TransactionDecoder {
    public decode(txn: Uint8Array) {
        const sender = this.getSender(txn);

        const senderBytes = hexToBytes(sender.toLowerCase());
        return this.decode2(txn, senderBytes);
    }

    private decode2(txn: Uint8Array, sender: Uint8Array) {
        const txnDv = new DataView(txn.buffer, txn.byteOffset, txn.byteLength);

        // nonce is always 4 bytes, after identifies (1byte) and chainId (1byte)
        const nonce = txnDv.getInt32(2, false);

        switch (txn[0]) {
            case Transaction_ID.TRANSFER:
                return this.decodeTransfer(txn, sender, nonce);

            case Transaction_ID.JOIN:
                return this.decodeJoin(txn, sender, nonce);

            case Transaction_ID.CLAIM_SPOT:
                return this.decodeClaimSpot(txn, sender, nonce);

            case Transaction_ID.DELEGATE:
                return this.decodeDelegate(txn, sender, nonce);

            case Transaction_ID.WITHDRAW:
                return this.decodeWithdraw(txn, sender, nonce);

            case Transaction_ID.VM_DATA_TXN:
                return this.decodeVmDataTxn(txn, sender, nonce);

            case Transaction_ID.CLAIM_VM_ID:
                return this.decodeClaimVmId(txn, sender, nonce);

            case Transaction_ID.SET_GUARDIAN:
                return this.decodeSetGuardian(txn, sender, nonce);

            case Transaction_ID.REMOVE_GUARDIAN:
                return this.decodeRemoveGuardianTxn(txn, sender, nonce);

            case Transaction_ID.GUARDIAN_TXN:
                throw new Error('Guardian transaction not implemented');

            case Transaction_ID.PAYABLE_VM_DATA_TXN:
                throw new Error('Payable VM Data transaction not implemented');

            case Transaction_ID.CONDUIT_TXN:
                throw new Error('Conduit transaction not implemented');

            case Transaction_ID.SET_CONDUIT:
                throw new Error('Set Conduit transaction not implemented');

            case Transaction_ID.ADD_CONDUITS:
                throw new Error('Add Conduits transaction not implemented');

            case Transaction_ID.REMOVE_CONDUITS:
                throw new Error('Remove Conduits transaction not implemented');

            case Transaction_ID.MOVE_STAKE:
                throw new Error('Move Stake transaction not implemented');

            case Transaction_ID.CHANGE_EARLY_WITHDRAW_PENALTY_PROPOSAL:
                // prettier-ignore
                return this.decodeChangeEarlyWithdrawPenaltyProposal(txn, sender, nonce);

            case Transaction_ID.CHANGE_FEE_PER_BYTE_PROPOSAL:
                // prettier-ignore
                return this.decodeChangeFeePerByteProposalTxn(txn, sender, nonce);

            case Transaction_ID.CHANGE_MAX_BLOCK_SIZE_PROPOSAL:
                // prettier-ignore
                return this.decodeChangeMaxBlockSizeProposalTxn(txn, sender, nonce);

            case Transaction_ID.CHANGE_MAX_TXN_SIZE_PROPOSAL:
                // prettier-ignore
                return this.decodeChangeMaxTxnSizeProposalTxn(txn, sender, nonce);

            case Transaction_ID.CHANGE_OVERALL_BURN_PERCENTAGE_PROPOSAL:
                // prettier-ignore
                return this.decodeChangeOverallBurnPercentageProposalTxn(txn, sender, nonce);

            case Transaction_ID.CHANGE_REWARD_PER_YEAR_PROPOSAL_TXN:
                // prettier-ignore
                return this.decodeChangeRewardPerYearProposalTxn(txn, sender, nonce);

            case Transaction_ID.CHANGE_OVERALL_BURN_PERCENTAGE_PROPOSAL:
                // prettier-ignore
                return this.decodeChangeOverallBurnPercentageProposalTxn(txn, sender, nonce);

            case Transaction_ID.CHANGE_VALIDATOR_COUNT_LIMIT_PROPOSAL:
                // prettier-ignore
                return this.decodeChangeValidatorCountLimitProposalTxn(txn, sender, nonce);

            case Transaction_ID.CHANGE_VALIDATOR_JOINING_FEE_PROPOSAL:
                // prettier-ignore
                return this.decodeChangeValidatorJoiningFeeProposalTxn(txn, sender, nonce);

            case Transaction_ID.CHANGE_VM_ID_CLAIMING_FEE_PROPOSAL:
                // prettier-ignore
                return this.decodeChangeVmIdClaimingFeeProposalTxn(txn, sender, nonce);

            case Transaction_ID.CHANGE_VM_OWNER_TXN_FEE_SHARE_PROPOSAL:
                // prettier-ignore
                return this.decodeChangeVmOwnerTxnFeeShareProposalTxn(txn, sender, nonce);

            case Transaction_ID.OTHER_PROPOSAL_TXN:
                // prettier-ignore
                return this.decodeOtherProposalTxn(txn, sender, nonce);

            case Transaction_ID.VOTE_ON_PROPOSAL_TXN:
                // prettier-ignore
                return this.decodeVoteOnProposalTxn(txn, sender, nonce);

            default:
                throw new Error('Invalid transaction type');
        }
    }

    public decodeTransfer(txn: Uint8Array, sender: Uint8Array, nonce: number) {
        if (txn.length !== 34 && txn.length !== 99) {
            throw new Error('Invalid txn length for transfer txn');
        }

        const dataView = new DataView(txn.buffer, txn.byteOffset, txn.byteLength);

        const amount = dataView.getBigInt64(6, false); // Read amount as BigInt for precision

        const recipientBytes = new Uint8Array(txn.buffer, 14, 20); // Extract recipient address bytes
        const senderHex = `0x${bytesToHex(sender)}`;
        const recipientHex = `0x${bytesToHex(recipientBytes)}`;

        return {
            sender: senderHex,
            receiver: recipientHex,
            value: amount.toString(),
            nonce: nonce,
            size: txn.length,
            rawTransaction: txn,
            chainId: txn[1],
            type: txn[0],
        };
    }

    public decodeJoin(txn: Uint8Array, sender: Uint8Array, nonce: number) {
        if (txn.length < 79 || txn.length > 87) {
            throw new Error('Invalid length for join txn');
        }

        // Layout:
        // Identifier - 1
        // chain id - 1
        // Nonce - 4
        // ip - X (variable length)
        // signature - 65

        const ipStartIndex = 6; // After identifier (1), chain id (1), and nonce (4)
        const ipLength = txn.length - 71; // Total length minus the length of the other known components
        const ipBytes = new Uint8Array(txn.buffer, txn.byteOffset + ipStartIndex, ipLength); // Extract IP bytes

        // Convert IP byte array to UTF-8 string
        const textDecoder = new TextDecoder('utf-8');
        const ip = textDecoder.decode(ipBytes);

        const senderHex = `0x${bytesToHex(sender)}`;

        return {
            sender: senderHex,
            nonce: nonce,
            size: txn.length,
            ip: ip,
            rawTransaction: txn,
            chainId: txn[1],
            type: txn[0],
        };
    }

    public decodeClaimSpot(txn: Uint8Array, sender: Uint8Array, nonce: number) {
        if (txn.length != 71) throw new Error('Invalid length for claim spot txn');

        /*
         * Identifier - 1
         * chain id - 1
         * Nonce - 4
         * signature - 65
         * */

        return {
            sender: `0x${bytesToHex(sender)}`,
            nonce: nonce,
            size: txn.length,
            rawTransaction: txn,
            chainId: txn[1],
            type: txn[0],
        };
    }

    public decodeDelegate(txn: Uint8Array, sender: Uint8Array, nonce: number) {
        if (txn.length != 34 /*Without Signature*/ && txn.length != 99 /*With Signature*/)
            throw new Error('Invalid length for delegate txn');

        /*
         * Identifier - 1
         * chain id - 1
         * Nonce - 4
         * amount - 8
         * validator - 20
         * signature - 65*/

        const dataView = new DataView(txn.buffer, txn.byteOffset, txn.byteLength);
        const amount = dataView.getBigInt64(6, false);

        // Extract validator address which starts at byte 14 and is 20 bytes long
        const validatorStart = 14;
        const validatorBytes = new Uint8Array(txn.buffer, validatorStart, 20);

        // Convert byte arrays to hex strings
        const senderHex = `0x${bytesToHex(sender)}`;
        const validatorHex = `0x${bytesToHex(validatorBytes)}`;

        return {
            sender: senderHex,
            validator: validatorHex,
            amount: amount.toString(),
            nonce: nonce,
            size: txn.length,
            rawTransaction: txn,
            chainId: txn[1],
            type: txn[0],
        };
    }

    public decodeWithdraw(txn: Uint8Array, sender: Uint8Array, nonce: number) {
        if (txn.length != 34 /*Without Signature*/ && txn.length != 99 /*With Signature*/)
            throw new Error('Invalid length for withdraw txn');

        /*
         * Identifier - 1
         * chain id - 1
         * Nonce - 4
         * amount - 8
         * validator - 20
         * signature - 65*/

        const dataView = new DataView(txn.buffer, txn.byteOffset, txn.byteLength);

        const amount = dataView.getBigInt64(6, false);

        // Extract validator address which starts at byte 14 and is 20 bytes long
        const validatorStart = 14;
        const validatorBytes = new Uint8Array(txn.buffer, validatorStart, 20);

        // Convert byte arrays to hex strings
        const senderHex = `0x${bytesToHex(sender)}`;
        const validatorHex = `0x${bytesToHex(validatorBytes)}`;

        return {
            sender: senderHex,
            validator: validatorHex,
            sharesAmount: amount.toString(),
            nonce: nonce,
            size: txn.length,
            rawTransaction: txn,
            chainId: txn[1],
            type: txn[0],
        };
    }

    public decodeVmDataTxn(txn: Uint8Array, sender: Uint8Array, nonce: number) {
        if (txn.length < 14) {
            throw new Error('Invalid length for VM Data txn');
        }

        /*
         * Identifier - 1
         * chain id - 1
         * Nonce - 4
         * External VM ID - 8
         * Data - x
         * signature - 65
         * */

        const dataView = new DataView(txn.buffer, txn.byteOffset, txn.byteLength);

        const externalVmId = dataView.getBigUint64(6, false); // Assuming little-endian

        let dataLength;
        const senderHex = bytesToHex(sender);

        if (PWRJS.isVidaAddress(senderHex)) {
            // Assuming `isVmAddress` checks if the address is a VM
            dataLength = txn.length - 14;
        } else {
            dataLength = txn.length - 79; // Adjusted for the presence of a signature
        }

        const data = new Uint8Array(txn.buffer, txn.byteOffset + 14, dataLength); // Data starts after the VM ID

        return {
            sender: `0x${bytesToHex(sender)}`,
            nonce: nonce,
            size: txn.length,
            vmId: externalVmId.toString(), // Converting BigInt to string for safety in JS environments
            data: `0x${bytesToHex(data)}`,
            rawTransaction: txn,
            chainId: txn[1],
            type: txn[0],
        };
    }

    public decodeClaimVmId(txn: Uint8Array, sender: Uint8Array, nonce: number) {
        if (txn.length != 14 /*Without Signature*/ && txn.length != 79 /*With Signature*/)
            throw new Error('Invalid length for claim vm id txn');

        /*
         * Identifier - 1
         * chain id - 1
         * Nonce - 4
         * External VM ID - 8
         * signature - 65
         * */

        const dataView = new DataView(txn.buffer, txn.byteOffset, txn.byteLength);

        const vmId = dataView.getBigUint64(6, false); // Assuming little-endian

        return {
            sender: `0x${bytesToHex(sender)}`,
            nonce: nonce,
            size: txn.length,
            vmId: vmId.toString(),
            rawTransaction: txn,
            chainId: txn[1],
            type: txn[0],
        };
    }

    public decodeSetGuardian(txn: Uint8Array, sender: Uint8Array, nonce: number) {
        if (txn.length != 99) throw new Error('Invalid length for set guardian txn');

        /*
         * Identifier - 1
         * chain id - 1
         * Nonce - 4
         * Long - 8
         * address - 20
         * signature - 65
         * */

        const dataView = new DataView(txn.buffer, txn.byteOffset, txn.byteLength);

        // get the expiry date
        const expiryDateMil = dataView.getBigInt64(6, false); // Little-endian

        // Extract guardian address which starts at byte 14 and is 20 bytes long
        const guardianStart = 14;
        const guardianBytes = new Uint8Array(txn.buffer, guardianStart, 20);

        // Convert byte arrays to hex strings
        const senderHex = `0x${bytesToHex(sender)}`;
        const guardianHex = `0x${bytesToHex(guardianBytes)}`;

        return {
            sender: senderHex,
            guardian: guardianHex,
            expiryDate: Number(expiryDateMil),
            nonce: nonce,
            size: txn.length,
            rawTransaction: txn,
            chainId: txn[1],
            type: txn[0],
        };
    }

    public decodeRemoveGuardianTxn(txn: Uint8Array, sender: Uint8Array, nonce: number) {
        if (txn.length != 71) throw new Error('Invalid length for remove guardian txn');

        /*
         * Identifier - 1
         * chain id - 1
         * Nonce - 4
         * signature - 65
         * */

        return {
            sender: `0x${bytesToHex(sender)}`,
            nonce: nonce,
            size: txn.length,
            rawTransaction: txn,
            chainId: txn[1],
            type: txn[0],
        };
    }

    public decodeGuardianApprovalTxn(txn: Uint8Array, sender: Uint8Array, nonce: number) {
        /*
         * Identifier - 1
         * chain id - 1
         * Nonce - 4
         * Txn - x
         * signature - 65
         * */

        const buffer = new Uint8Array(txn);
        let position = 6;

        const wrappedTxns: Uint8Array[] = [];

        while (buffer.length - position > 65) {
            const txnLength =
                (buffer[position] << 24) |
                (buffer[position + 1] << 16) |
                (buffer[position + 2] << 8) |
                buffer[position + 3];
            position += 4;

            const wrappedTxn = buffer.slice(position, position + txnLength);
            wrappedTxns.push(wrappedTxn);
            position += txnLength;
        }

        const txns = wrappedTxns.map((wrappedTxn) => this.decode(wrappedTxn));

        return {
            sender: `0x${bytesToHex(sender)}`,
            nonce: nonce,
            size: txn.length,
            transactions: txns,
            rawTransaction: buffer,
            chainId: buffer[1],
            type: buffer[0],
        };
    }

    // #region proposals
    public decodeChangeEarlyWithdrawPenaltyProposal(
        txn: Uint8Array,
        sender: Uint8Array,
        nonce: number
    ) {
        if (txn.length < 18)
            throw new Error('Invalid length for change early withdraw penalty proposal txn');

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

        const dataView = new DataView(txn.buffer, txn.byteOffset, txn.byteLength);

        const titleSize = dataView.getInt32(6, false);

        const title_b = new Uint8Array(txn.buffer, 10, titleSize);
        const title = new TextDecoder().decode(title_b);

        const withdraWalPenaltyTime = dataView.getBigInt64(10 + titleSize, false);
        const withdrawalPenalty = dataView.getInt32(18 + titleSize, false);

        const description_b = new Uint8Array(
            txn.buffer,
            22 + titleSize,
            txn.length - 87 - titleSize
        );
        const description = new TextDecoder().decode(description_b);

        return {
            sender: `0x${bytesToHex(sender)}`,
            nonce: nonce,
            size: txn.length,
            extraFee: 0,
            withdrawalPenaltyTime: withdraWalPenaltyTime.toString(),
            withdrawalPenalty: withdrawalPenalty,
            description,
            title,
            rawTransaction: txn,
            chainId: txn[1],
            type: txn[0],
        };
    }

    public decodeChangeFeePerByteProposalTxn(txn: Uint8Array, sender: Uint8Array, nonce: number) {
        if (txn.length < 16) throw new Error('Invalid length for change fee per byte proposal txn');

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

        const dataView = new DataView(txn.buffer, txn.byteOffset, txn.byteLength);

        const titleSize = dataView.getInt32(6, false);
        const title_b = new Uint8Array(txn.buffer, 10, titleSize);
        const title = new TextDecoder().decode(title_b);

        const feePerByte = dataView.getBigInt64(10 + titleSize, false);

        const description_b = new Uint8Array(
            txn.buffer,
            18 + titleSize,
            txn.length - 83 - titleSize
        );

        const description = new TextDecoder().decode(description_b);

        return {
            sender: `0x${bytesToHex(sender)}`,
            nonce: nonce,
            size: txn.length,
            feePerByte: feePerByte.toString(),
            description,
            title,
            rawTransaction: txn,
            chainId: txn[1],
            type: txn[0],
        };
    }

    public decodeChangeMaxBlockSizeProposalTxn(txn: Uint8Array, sender: Uint8Array, nonce: number) {
        if (txn.length < 10) throw new Error('Invalid length for change fee per byte proposal txn');

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

        const dataView = new DataView(txn.buffer, txn.byteOffset, txn.byteLength);

        const titleSize = dataView.getInt32(6, false);
        const title_b = new Uint8Array(txn.buffer, 10, titleSize);
        const title = new TextDecoder().decode(title_b);

        const maxBlockSize = dataView.getInt32(10 + titleSize, false);

        const description_b = new Uint8Array(
            txn.buffer,
            14 + titleSize,
            txn.length - 79 - titleSize
        );

        const description = new TextDecoder().decode(description_b);

        return {
            sender: `0x${bytesToHex(sender)}`,
            nonce: nonce,
            size: txn.length,
            maxBlockSize: maxBlockSize,
            description,
            title,
            rawTransaction: txn,
            chainId: txn[1],
            type: txn[0],
        };
    }

    public decodeChangeMaxTxnSizeProposalTxn(txn: Uint8Array, sender: Uint8Array, nonce: number) {
        if (txn.length < 10) throw new Error('Invalid length for change fee per byte proposal txn');
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

        const dataView = new DataView(txn.buffer, txn.byteOffset, txn.byteLength);

        const titleSize = dataView.getInt32(6, false);
        const title_b = new Uint8Array(txn.buffer, 10, titleSize);
        const title = new TextDecoder().decode(title_b);

        const maxTxnSize = dataView.getInt32(10 + titleSize, false);

        const description_b = new Uint8Array(
            txn.buffer,
            14 + titleSize,
            txn.length - 79 - titleSize
        );
        const description = new TextDecoder().decode(description_b);

        return {
            sender: `0x${bytesToHex(sender)}`,
            nonce: nonce,
            size: txn.length,
            maxTxnSize: maxTxnSize,
            description,
            title,
            rawTransaction: txn,
            chainId: txn[1],
            type: txn[0],
        };
    }

    public decodeChangeOverallBurnPercentageProposalTxn(
        txn: Uint8Array,
        sender: Uint8Array,
        nonce: number
    ) {
        if (txn.length < 10)
            throw new Error('Invalid length for change overall burn percentage proposal txn');

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

        const dataView = new DataView(txn.buffer, txn.byteOffset, txn.byteLength);

        const titleSize = dataView.getInt32(6, false);
        const title_b = new Uint8Array(txn.buffer, 10, titleSize);
        const title = new TextDecoder().decode(title_b);

        const overallBurnPercentage = dataView.getInt32(10 + titleSize, false);

        const description_b = new Uint8Array(
            txn.buffer,
            14 + titleSize,
            txn.length - 79 - titleSize
        );

        const description = new TextDecoder().decode(description_b);

        return {
            sender: `0x${bytesToHex(sender)}`,
            nonce: nonce,
            size: txn.length,
            burnPercentage: overallBurnPercentage,
            description,
            title,
            rawTransaction: txn,
            chainId: txn[1],
            type: txn[0],
        };
    }

    public decodeChangeRewardPerYearProposalTxn(
        txn: Uint8Array,
        sender: Uint8Array,
        nonce: number
    ) {
        if (txn.length < 14) throw new Error('Invalid length for change fee per byte proposal txn');

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

        const dataView = new DataView(txn.buffer, txn.byteOffset, txn.byteLength);

        const titleSize = dataView.getInt32(6, false);
        const title_b = new Uint8Array(txn.buffer, 10, titleSize);
        const title = new TextDecoder().decode(title_b);

        const rewardPerYear = dataView.getBigInt64(10 + titleSize, false);

        const description_b = new Uint8Array(
            txn.buffer,
            18 + titleSize,
            txn.length - 83 - titleSize
        );

        const description = new TextDecoder().decode(description_b);

        return {
            sender: `0x${bytesToHex(sender)}`,
            nonce: nonce,
            size: txn.length,
            rewardPerYear: rewardPerYear.toString(),
            description,
            title,
            rawTransaction: txn,
            chainId: txn[1],
            type: txn[0],
        };
    }

    public decodeChangeValidatorCountLimitProposalTxn(
        txn: Uint8Array,
        sender: Uint8Array,
        nonce: number
    ) {
        if (txn.length < 10) throw new Error('Invalid length for change fee per byte proposal txn');

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

        const dataView = new DataView(txn.buffer, txn.byteOffset, txn.byteLength);

        const titleSize = dataView.getInt32(6, false);
        const title_b = new Uint8Array(txn.buffer, 10, titleSize);
        const title = new TextDecoder().decode(title_b);

        const validatorCountLimit = dataView.getInt32(10 + titleSize, false);

        const description_b = new Uint8Array(
            txn.buffer,
            14 + titleSize,
            txn.length - 79 - titleSize
        );
        const description = new TextDecoder().decode(description_b);

        return {
            sender: `0x${bytesToHex(sender)}`,
            nonce: nonce,
            size: txn.length,
            validatorCountLimit,
            description,
            title,
            rawTransaction: txn,
            chainId: txn[1],
            type: txn[0],
        };
    }

    public decodeChangeValidatorJoiningFeeProposalTxn(
        txn: Uint8Array,
        sender: Uint8Array,
        nonce: number
    ) {
        if (txn.length < 14) throw new Error('Invalid length for change fee per byte proposal txn');

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

        const dataView = new DataView(txn.buffer, txn.byteOffset, txn.byteLength);

        const titleSize = dataView.getInt32(6, false);
        const title_b = new Uint8Array(txn.buffer, 10, titleSize);
        const title = new TextDecoder().decode(title_b);

        const joiningFee = dataView.getBigInt64(10 + titleSize, false);

        const description_b = new Uint8Array(
            txn.buffer,
            18 + titleSize,
            txn.length - 83 - titleSize
        );

        const description = new TextDecoder().decode(description_b);

        return {
            sender: `0x${bytesToHex(sender)}`,
            nonce: nonce,
            size: txn.length,
            joiningFee: joiningFee.toString(),
            description,
            title,
            rawTransaction: txn,
            chainId: txn[1],
            type: txn[0],
        };
    }

    public decodeChangeVmIdClaimingFeeProposalTxn(
        txn: Uint8Array,
        sender: Uint8Array,
        nonce: number
    ) {
        if (txn.length < 18)
            throw new Error('Invalid length for change vm id claiming fee proposal txn');

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

        const dataView = new DataView(txn.buffer, txn.byteOffset, txn.byteLength);

        const titleSize = dataView.getInt32(6, false);
        const title_b = new Uint8Array(txn.buffer, 10, titleSize);
        const title = new TextDecoder().decode(title_b);

        const vmIdClaimingFee = dataView.getBigInt64(10 + titleSize, false);

        const description_b = new Uint8Array(
            txn.buffer,
            18 + titleSize,
            txn.length - 83 - titleSize
        );

        const description = new TextDecoder().decode(description_b);

        return {
            sender: `0x${bytesToHex(sender)}`,
            nonce: nonce,
            size: txn.length,
            claimingFee: vmIdClaimingFee.toString(),
            description,
            title,
            rawTransaction: txn,
            chainId: txn[1],
            type: txn[0],
        };
    }

    public decodeChangeVmOwnerTxnFeeShareProposalTxn(
        txn: Uint8Array,
        sender: Uint8Array,
        nonce: number
    ) {
        if (txn.length < 10)
            throw new Error('Invalid length for change vm owner txn fee share proposal txn');
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

        const dataView = new DataView(txn.buffer, txn.byteOffset, txn.byteLength);

        const titleSize = dataView.getInt32(6, false);
        const title_b = new Uint8Array(txn.buffer, 10, titleSize);
        const title = new TextDecoder().decode(title_b);

        const vmOwnerTxnFeeShare = dataView.getInt32(10 + titleSize, false);

        const description_b = new Uint8Array(
            txn.buffer,
            14 + titleSize,
            txn.length - 79 - titleSize
        );

        const description = new TextDecoder().decode(description_b);

        return {
            sender: `0x${bytesToHex(sender)}`,
            nonce: nonce,
            size: txn.length,
            feeShare: vmOwnerTxnFeeShare,
            description,
            title,
            rawTransaction: txn,
            chainId: txn[1],
            type: txn[0],
        };
    }

    public decodeOtherProposalTxn(txn: Uint8Array, sender: Uint8Array, nonce: number) {
        if (txn.length < 6)
            throw new Error('Invalid length for change vm owner txn fee share proposal txn');

        /*
        Identifier - 1
        chain id - 1
        nonce - 4
        title size identifier - 4
        title - x
        description - x
        signature - 65
        */

        const dataView = new DataView(txn.buffer, txn.byteOffset, txn.byteLength);

        const titleSize = dataView.getInt32(6, false);
        const title_b = new Uint8Array(txn.buffer, 10, titleSize);
        const title = new TextDecoder().decode(title_b);

        const description_b = new Uint8Array(
            txn.buffer,
            10 + titleSize,
            txn.length - 75 - titleSize
        );
        const description = new TextDecoder().decode(description_b);

        return {
            sender: `0x${bytesToHex(sender)}`,
            nonce: nonce,
            size: txn.length,
            description,
            title,
            rawTransaction: txn,
            chainId: txn[1],
            type: txn[0],
        };
    }

    public decodeVoteOnProposalTxn(txn: Uint8Array, sender: Uint8Array, nonce: number) {
        if (txn.length < 6)
            throw new Error('Invalid length for change vm owner txn fee share proposal txn');

        /*
        Identifier - 1
        chain id - 1
        nonce - 4
        proposal hash - 32
        vote - 1
        signature - 65
        */

        const dataView = new DataView(txn.buffer, txn.byteOffset, txn.byteLength);

        const proposalHash = new Uint8Array(txn.buffer, 6, 32);

        const vote = txn[38];

        return {
            sender: `0x${bytesToHex(sender)}`,
            nonce: nonce,
            size: txn.length,
            proposalHash: `0x${bytesToHex(proposalHash)}`,
            vote: vote,
            rawTransaction: txn,
            chainId: txn[1],
            type: txn[0],
        };
    }

    // #endregion

    // *~~~ help methods ~~~* //
    private getSender(txn: Uint8Array) {
        const signature = new Uint8Array(65);
        const txnData = new Uint8Array(txn.length - 65);

        // Copy the first part of txn to txnData
        txnData.set(new Uint8Array(txn.buffer, txn.byteOffset, txnData.length));

        // Copy the last 65 bytes of txn to signature
        signature.set(new Uint8Array(txn.buffer, txn.byteOffset + txnData.length, 65));

        return TransactionDecoder.getSigner(txnData, signature);
    }

    static getSigner(txn: Uint8Array, signature: Uint8Array) {
        // Extract r, s, and v from the signature
        const r = ethers.hexlify(signature.slice(0, 32));
        const s = ethers.hexlify(signature.slice(32, 64));
        const v = signature[64];

        // Create a signature object expected by Ethers
        const fullSignature = {
            r: r,
            s: s,
            v: v,
        };

        // Compute the message digest (hash) of the transaction
        const messageHash = ethers.keccak256(txn);

        // Recover the address
        const recoveredAddress = ethers.recoverAddress(messageHash, fullSignature);

        return recoveredAddress;
    }
}
