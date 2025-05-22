import { describe, test, expect } from 'vitest';

import PWRJS from '../../src/protocol/pwrjs';

describe('pwrjs core blocks', () => {
    const url = 'http://46.101.151.203:8085';

    const testAddress = '0xffb927e3e1fd43fc47bd140c817af780241d1b31';
    const vmAddress = '0x1000000000000000000000000000000000010023';

    const pwrjs = new PWRJS(url);

    // #region blocks

    test('blocks count', async () => {
        const blocksCount = await pwrjs.getBlocksCount();
        expect(blocksCount).toBeGreaterThan(0);
    });

    test('max block size', async () => {
        const maxBlockSize = await pwrjs.getMaxBlockSize();
        expect(maxBlockSize).toBe(5000000);
    });

    test('Max Transaction Size', async () => {
        const maxTxnSize = await pwrjs.getMaxTransactionSize();
        expect(maxTxnSize).toBe(2000000);
    });

    test('block number', async () => {
        const blockNumber = await pwrjs.getBlockNumber();
        expect(blockNumber).toBeGreaterThan(0);
    });

    test('block timestamp', async () => {
        const blockTimestamp = await pwrjs.getBlockTimestamp();
        expect(blockTimestamp).toBeGreaterThan(0);
    });

    test('latest block number', async () => {
        const latestBlockNumber = await pwrjs.getLatestBlockNumber();
        expect(latestBlockNumber).toBeGreaterThan(0);
    });

    test('block by number', async () => {
        const block = await pwrjs.getBlockByNumber(10);

        expect(block).toHaveProperty('blockNumber', 10);
        expect(block).toHaveProperty('timeStamp');
        expect(block).toHaveProperty('blockReward');
        expect(block).toHaveProperty('burnedFees');
        expect(block).toHaveProperty('size');
        expect(block).toHaveProperty('blockchainVersion');
        expect(block).toHaveProperty('blockHash');
        expect(block).toHaveProperty('previousBlockHash');
        expect(block).toHaveProperty('rootHash');
        expect(block).toHaveProperty('proposer');
        expect(block).toHaveProperty('transactions');
        expect(block).toHaveProperty('processedWithoutCriticalErrors');
    });

    test('latest block number', async () => {
        const latestBlockNumber = await pwrjs.getLatestBlockNumber();
        expect(latestBlockNumber).toBeGreaterThan(0);
    });

    test('get block with vida transactions only', async () => {
        const block = await pwrjs.getBlockWithViDataTransactionsOnly(10, 0);

        expect(block).toHaveProperty('blockNumber', 10);
    });

    // #endregion
});
