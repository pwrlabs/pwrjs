import BigNumber from 'bignumber.js';
import { BnToBytes, HexToBytes, decToBytes } from '../utils';
import { Transaction_ID } from '../static/enums/transaction.enum';

export default class TransactionBuilder {
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

        const b_Id = decToBytes(Transaction_ID.DELEGATE, 1);
        const b_chainId = decToBytes(chainId, 1);
        const b_nonce = decToBytes(nonce, 4);
        const b_amount = BnToBytes(amountBN);
        const b_validator = HexToBytes(validator);

        const txnBytes = new Uint8Array([
            ...b_Id,
            ...b_chainId,
            ...b_nonce,
            ...b_amount,
            ...b_validator,
        ]);

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
        if (expiryDate < Date.now()) {
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

        const b_Id = decToBytes(Transaction_ID.SET_GUARDIAN, 1);
        const b_chainId = decToBytes(chainId, 1);
        const b_nonce = decToBytes(nonce, 4);
        const b_expiryDate = decToBytes(expiryDate, 8);
        const b_guardian = HexToBytes(guardian);

        const txnBytes = new Uint8Array([
            ...b_Id,
            ...b_chainId,
            ...b_nonce,
            ...b_expiryDate,
            ...b_guardian,
        ]);

        return txnBytes;
    }
}
