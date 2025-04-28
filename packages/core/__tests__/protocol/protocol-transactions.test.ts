import { describe, test, expect } from 'vitest';

import PWRJS from '../../src/protocol/pwrjs';

import {
    AnyFalconTransaction,
    PayableVidaDataTransaction,
    Transactions,
    TransferTransaction,
} from '../../src/entities/falcon-transaction.entity';

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
            '0x4858df364241221c2914907dce78dd2e98be880afae370af80d646b6e2753764';
        const res = await pwrjs.getTransactionByHash(transactionHash);

        const tx = res as TransferTransaction;

        expect(tx).toHaveProperty('identifier', Transactions.TRANSFER);
        checkBaseTxn(tx);
        expect(tx).toHaveProperty('receiver');
        expect(tx).toHaveProperty('amount');
    });

    test('retrieve multiple transactions by hash', async () => {
        const hashes = [
            '0xccfae04dc39c1a473df1336fbd17b1d44213fccb06334847caeb14f860ef1a8d',
            '0x6a6d21f2930f02837aca8b953edb0a149d449d3e87357da154db36350600a2dc',
        ];

        const res = await pwrjs.getTransactionsByHashes(hashes);

        const tx_0 = res[0] as TransferTransaction;
        const tx_1 = res[1] as PayableVidaDataTransaction;

        expect(tx_0).toHaveProperty('identifier', Transactions.TRANSFER);
        checkBaseTxn(tx_0);
        expect(tx_0).toHaveProperty('receiver');
        expect(tx_0).toHaveProperty('amount');

        expect(tx_1).toHaveProperty('identifier', Transactions.PAYABLE_VIDA_DATA);
        checkBaseTxn(tx_1);
        expect(tx_1).toHaveProperty('vidaId');
        expect(tx_1).toHaveProperty('data');
    });

    // #endregion
});
