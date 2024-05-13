import BigNumber from 'bignumber.js';
import { BnToBytes, HexToBytes, decToBytes, decToBytes2 } from '../utils';
import { Transaction_ID } from '../static/enums/transaction.enum';

export default class TransactionBuilder {
    private static getTransactionBase(
        id: Transaction_ID,
        chainId: number,
        nonce: number
    ) {
        const b_Id = decToBytes(id, 1);
        const b_chainId = decToBytes(chainId, 1);
        const b_nonce = decToBytes(nonce, 4);

        const txnBytes = new Uint8Array([...b_Id, ...b_chainId, ...b_nonce]);

        return txnBytes;
    }

    static getTransferPwrTransaction(
        chainId: number,
        nonce: number,
        amount: string,
        to: string
    ): Uint8Array {
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
         * address - 20
         * signature - 65*/

        const base = this.getTransactionBase(
            Transaction_ID.TRANSFER,
            chainId,
            nonce
        );

        const b_amount = BnToBytes(amountBN);
        const b_to = HexToBytes(to);

        const txnBytes = new Uint8Array([...base, ...b_amount, ...b_to]);

        return txnBytes;
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

        const base = this.getTransactionBase(
            Transaction_ID.VM_DATA_TXN,
            chainId,
            nonce
        );

        const b_vmId = BnToBytes(new BigNumber(vmId));
        const b_data = new TextEncoder().encode(data);

        const txnBytes = new Uint8Array([...base, ...b_vmId, ...b_data]);

        return txnBytes;
    }

    static getClaimVmIdTransaction(
        vmId: string,
        nonce: number,
        chainId: number
    ): Uint8Array {
        const base = this.getTransactionBase(
            Transaction_ID.CLAIM_VM_ID,
            chainId,
            nonce
        );

        const b_vmId = BnToBytes(new BigNumber(vmId));

        const txnBytes = new Uint8Array([...base, ...b_vmId]);

        return txnBytes;
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
        data: string,
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

        const b_vmId = BnToBytes(new BigNumber(vmId));
        const b_value = BnToBytes(new BigNumber(value));
        const b_data = new TextEncoder().encode(data);

        const txnBytes = new Uint8Array([
            ...base,
            ...b_vmId,
            ...b_data,
            ...b_value,
        ]);

        return txnBytes;
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
}
