'use strict';

import PWRJS from '../src/pwr/pwr';

import WalletUtils from '../src/wallet.utils';

describe('pwrjs core', () => {
    const url = 'https://pwrrpc.pwrlabs.io';
    const testAddress = '0x53d183769292d4f398d23acf49e8acffbebebdf2';

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

        expect(balanceOfTest.toString()).toBe((4 * 10 ** 9).toString());
    });

    it('PWRJS blocks count', async () => {
        const blocksCount = await PWRJS.getBlocksCount();

        expect(blocksCount).toBeGreaterThan(0);
    });

    it('PWRJS block', async () => {
        const firstBlock = await PWRJS.getBlockByNumber(1);

        const firstBlockData = {
            blockHash:
                '0x8787a1328eca6aa30df325c4fa7f65f45ae70a8ae61cdae4c1e72fd79608c437',
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
                    to: '0xc7e9fbfbd60df0cfcf3e8a3c5b30ed0def178c57',
                    txnFee: 9800,
                    type: 'Transfer',
                    value: 100000000000,
                    hash: '0x63878c584b35c920fa57d9eb6c53749f95fdc9170dfd4e1bb58bda20ff5e7d83',
                    rawTxn: '0000000000000000174876e800c7e9fbfbd60df0cfcf3e8a3c5b30ed0def178c57c0c4936af32d2f14c21bd36d5475dd43c49ec2b6047d108bb83ea076306d45b660c866d30e080639281027de7d3eda76bd7edebf6e2dc4435f8f3abb5f8642301c',
                },
            ],
            blockSubmitter: '0x61bd8fc1e30526aaf1c4706ada595d6d236d9883',
            blockSize: 217,
            timestamp: 1701061436,
        };

        expect(firstBlock).toEqual(firstBlockData);
    });

    it('PWRJS Validators count', async () => {
        const validatorsCount = await PWRJS.getTotalValidatorsCount();
        const standByValidators = await PWRJS.getSandbyValidatorsCount();
        const activeValidators = await PWRJS.getActiveValidatorsCount();

        expect(validatorsCount).toBeGreaterThan(0);
        expect(standByValidators).toBeGreaterThan(0);
        expect(activeValidators).toBeGreaterThan(0);
    });

    it('PWRJS validators', async () => {
        const validators = await PWRJS.getAllValidators();
        const standByValidators = await PWRJS.getStandbyValidators();
        const activeValidators = await PWRJS.getActiveValidators();

        expect(validators.length).toBeGreaterThan(0);
        expect(standByValidators.length).toBeGreaterThan(0);
        expect(activeValidators.length).toBeGreaterThan(0);

        // expect(validators).toBeGreaterThan(0);
    });
});
