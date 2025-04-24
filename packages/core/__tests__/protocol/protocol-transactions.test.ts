import { describe, test, expect } from 'vitest';

import PWRJS from '../../src/protocol/pwrjs';

import WalletUtils from '../../src/wallet.utils';

import { HttpTypes } from '../../src/entities/http.types';
import {
    AnyFalconTransaction,
    SetGuardianTransaction,
    SetPublicKeyTransaction,
    Transactions,
    TransferTransaction,
} from '../../src/entities/falcon-transaction.entity';

function sleep(timeMs: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeMs);
    });
}

describe('pwrjs core general', () => {
    const url = 'http://46.101.151.203:8085';

    const testAddress = '0xffb927e3e1fd43fc47bd140c817af780241d1b31';
    const vmAddress = '0x1000000000000000000000000000000000010023';

    const pwrjs = new PWRJS(url);

    function checkBaseTxn(transaction: AnyFalconTransaction) {
        expect(transaction).toHaveProperty('transactionHash');
        expect(transaction).toHaveProperty('sender');
        expect(transaction).toHaveProperty('nonce');
        expect(transaction).toHaveProperty('size');
        expect(transaction).toHaveProperty('positionInBlock');
        expect(transaction).toHaveProperty('blockNumber');
        expect(transaction).toHaveProperty('timeStamp');
        expect(transaction).toHaveProperty('feePerByte');
        expect(transaction).toHaveProperty('paidActionFee');
        expect(transaction).toHaveProperty('paidTotalFee');
        expect(transaction).toHaveProperty('success');
    }

    // #region transactions

    test('retrieve transaction by hash', async () => {
        const transactionHash =
            '0x6CECB4BCB7377CBEDDA26B4D71350D977A3AFB7F8578E6FDB30733948D707B29';
        const res = await pwrjs.getTransactionByHash(transactionHash);

        const tx = res as TransferTransaction;

        expect(tx).toHaveProperty('identifier', Transactions.TRANSFER);
        checkBaseTxn(tx);
        expect(tx).toHaveProperty('receiver');
        expect(tx).toHaveProperty('amount');
    });

    test('retrieve multiple transactions by hash', async () => {
        const hashes = [
            '0x280BFC342C6ED15E9E41E0CF078C4AB3F9B7EC0986F470A0C731756995BFA72F',
            '0x3FFE49E319C0F4D8B7ABE1B1146AB8C06D4E7C555F1C72205B02F736B988595B',
        ];

        const res = await pwrjs.getTransactionsByHashes(hashes);

        const tx_0 = res[0] as SetPublicKeyTransaction;
        const tx_1 = res[1] as SetGuardianTransaction;

        expect(tx_0).toHaveProperty('identifier', Transactions.SET_PUBLIC_KEY);
        checkBaseTxn(tx_0);
        expect(tx_0).toHaveProperty('publicKey');

        expect(tx_1).toHaveProperty('identifier', Transactions.SET_GUARDIAN);
        checkBaseTxn(tx_1);
        expect(tx_1).toHaveProperty('guardianAddress');
        expect(tx_1).toHaveProperty('guardianExpiryDate');
    });

    // #endregion
});
