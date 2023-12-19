import PWRJS from '../src/pwr/pwr';

import WalletUtils from '../src/wallet.utils';

describe('pwrjs core', () => {
    const url = 'https://pwrrpc.pwrlabs.io';
    const testAddress = '0xe47d5f4c1731c3c0ea0a75872593cbf61f2cbf90';

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
                '0xd79aecb3422622ad39d6edeacbe0b7f9f972938bf3fb76bee024ab4d42230b52',
            success: true,
            blockNumber: 1,
            blockReward: 9800,
            transactionCount: 1,
            transactions: [
                {
                    positionInTheBlock: 0,
                    nonceOrValidationHash: '1',
                    size: 98,
                    fee: 9800,
                    from: '0x61bd8fc1e30526aaf1c4706ada595d6d236d9883',
                    to: '0x32b3f8d2f336b3ecd2a111606fdcbad838534ef1',
                    txnFee: 9800,
                    type: 'Transfer',
                    value: 1001010000000,
                    hash: '0x6dca24964bce8b2ae46dfa4b60f2423c3b69b8457baa5ae9851e48c7fef5bae0',
                    rawTxn: '0000000001000000e910d8708032b3f8d2f336b3ecd2a111606fdcbad838534ef18cdf253d567e58a4bbe89a9001e388831f6b3e2915ac0ed629c7a940db13c3f410714024600e62a574bb13731e6fd5fbd39ce0485095d40c05dd096ad292fe4d1b',
                },
            ],
            blockSubmitter: '0x61bd8fc1e30526aaf1c4706ada595d6d236d9883',
            blockSize: 217,
            timestamp: 1701707027,
        };

        expect(firstBlock).toEqual(firstBlockData);
    });

    it('PWRJS Validators count', async () => {
        const validatorsCount = await PWRJS.getTotalValidatorsCount();
        const standByValidators = await PWRJS.getSandbyValidatorsCount();
        const activeValidators = await PWRJS.getActiveValidatorsCount();

        expect(validatorsCount).toBeGreaterThan(0);
        expect(standByValidators).toBe(0);
        expect(activeValidators).toBeGreaterThan(0);
    });

    it('PWRJS validators', async () => {
        const validators = await PWRJS.getAllValidators();
        const standByValidators = await PWRJS.getStandbyValidators();
        const activeValidators = await PWRJS.getActiveValidators();

        expect(validators.length).toBeGreaterThan(0);
        expect(standByValidators.length).toBe(0);
        expect(activeValidators.length).toBeGreaterThan(0);
    });
});
