'use strict';

import PWRJS from '../src/pwr/pwr';

import WalletUtils from '../src/wallet.utils';

describe('core', () => {
    const url = 'https://pwrrpc.pwrlabs.io';
    const testAddress = '0x98d17e999a8fd155186ebbfc255cc9b3c62b6175';

    it('PWRJS fee and url', () => {
        const fee = PWRJS.getFeePerByte();
        expect(fee).toBe(100);

        const nodeUrl = PWRJS.getRpcNodeUrl();
        expect(nodeUrl).toBeUndefined();
    });

    it('PWRJS methods without url', () => {
        try {
            PWRJS.getBalanceOfAddress(testAddress);

            expect(true).toBe(false);
        } catch (e) {
            expect(e.message).toBe('RPC Node URL is not defined');
        }
    });

    it('PWRJS set node url', () => {
        PWRJS.setRpcNodeUrl(url);
        const nodeUrl = PWRJS.getRpcNodeUrl();
        expect(nodeUrl).toBe(url);
    });

    it('PWRJS nonce', async () => {
        const randomWallet = WalletUtils.getRandomWallet();

        const nonce = await PWRJS.getNonceOfAddress(
            randomWallet.getAddressString()
        );

        expect(nonce).toBe(0);
    });

    it('PWRJS balance', async () => {
        const randomWallet = WalletUtils.getRandomWallet();

        const balanceOfRandom = await PWRJS.getBalanceOfAddress(
            randomWallet.getAddressString()
        );

        const balanceOfTest = await PWRJS.getBalanceOfAddress(testAddress);

        expect(balanceOfRandom).toBe(0);

        expect(balanceOfTest.toString()).toBe((100 * 10 ** 9).toString());
    });

    it('PWRJS blocks count', async () => {
        const blocksCount = await PWRJS.getBlocksCount();

        expect(blocksCount).toBeGreaterThan(0);
    });

    it('PWRJS block', async () => {
        const firstBlock = await PWRJS.getBlockByNumber(1);

        const firstBlockData = {
            blockHash:
                '0xea53f614d7d62f052dcf1bd868abc79add802f9147600c2241142e7bb04f6994',
            success: true,
            blockNumber: 1,
            blockReward: 9800,
            transactionCount: 1,
            transactions: [
                {
                    positionInTheBlock: 0,
                    nonceOrValidationHash: '0',
                    size: 98,
                    fee: 9800,
                    from: '0x2c86e018e43fe1effa7f43b7c128ee29a0e86853',
                    to: '0x334f2900e778842186a1a27c5244f003c3418d2e',
                    txnFee: 9800,
                    type: 'Transfer',
                    value: 100000000000,
                    hash: '0x9c5fb136533b2b4107438f195b3a0c10e209e0efc4adbb4533be91d141e20f52',
                },
            ],
            blockSubmitter: '0x61bd8fc1e30526aaf1c4706ada595d6d236d9883',
            blockSize: 217,
            timestamp: 1698219988,
        };

        expect(firstBlock).toEqual(firstBlockData);
    });

    it('PWRJS Validators count', async () => {
        const validatorsCount = await PWRJS.getValidatorsCount();

        expect(validatorsCount).toBeGreaterThan(0);
    });

    it('PWRJS validators count', async () => {});
});
