import PWRJS from '../src/protocol/pwrjs';

import WalletUtils from '../src/wallet.utils';

describe('pwrjs core', () => {
    const url = 'https://pwrrpc.pwrlabs.io';

    const testAddress = '0xe47d5f4c1731c3c0ea0a75872593cbf61f2cbf90';
    const vmAddress = '0x1000000000000000000000000000000000010023';

    // group of "it" tests

    // #region pwrjs properties

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

    it('PWRJS chain id', async () => {
        const chainId = await PWRJS.getChainId();

        expect(chainId).toBe(0);
    });

    it('PWRJS blockchain version', async () => {
        const blockchainVersion = await PWRJS.getBlockchainVersion();

        expect(blockchainVersion).toBe(1);
    });

    // #endregion

    // #region wallet methods

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

    // #endregion

    // #region blocks

    it('PWRJS blocks count', async () => {
        const blocksCount = await PWRJS.getBlocksCount();

        expect(blocksCount).toBeGreaterThan(0);
    });

    it('PWRJS first block', async () => {
        const firstBlock = await PWRJS.getBlockByNumber(1);

        const firstBlockData = {
            blockHash:
                '0x9df632bd0ed08ef2e58ccc4ae90f09735115d0eac47ab7d00c5cfbaa9f62cc03',
            success: true,
            blockNumber: 1,
            blockReward: 19900,
            transactionCount: 1,
            transactions: [
                {
                    hash: '0xe4326ad01c979981c392ab9bef254a1019f9b21f930d524241541e70cd59bd49',
                    extraFee: 0,
                    nonce: 1,
                    paid: false,
                    fee: 19900,
                    positionInTheBlock: 0,
                    size: 99,
                    type: 'Transfer',
                    value: 1001010000000,
                    sender: '0x61bd8fc1e30526aaf1c4706ada595d6d236d9883',
                    receiver: '0x61bd8fc1e30526aaf1c4706ada595d6d236d9881',
                    rawTxn: '0x000000000001000000e910d8708061bd8fc1e30526aaf1c4706ada595d6d236d988184d7bbf5fa6802c82fadc6670915d5a6a352d8e437343e2d80cb8043834057051c2ea7c6c5528bc4d15fc7b332821b1e7360ae6e1491f9be992de911012e399a1b',
                },
            ],
            blockSubmitter: '0x61bd8fc1e30526aaf1c4706ada595d6d236d9883',
            networkVotingPower: 100591597222897,
            blockSize: 228,
            timestamp: 1712241283,
        };

        expect(firstBlock).toEqual(firstBlockData);
    });

    // #endregion

    // #region vm
    it('PWRJS vmId', async () => {
        const vmId = PWRJS.getVmIdAddress(10023);

        expect(vmId).toBe(vmAddress);
    });

    it('PWRJ isVm address', async () => {
        const notVmAddress = PWRJS.isVmAddress(testAddress);
        const _vmAddress = PWRJS.isVmAddress(vmAddress);
        const _vmAddress2 = PWRJS.isVmAddress(
            '0x0000000000000000000007075656276978097000'
        );
        const _vmAddress3 = PWRJS.isVmAddress(
            '0x1000000000000000000007075656276978097000'
        );

        expect(notVmAddress).toBe(false);
        expect(_vmAddress).toBe(true);
        expect(_vmAddress2).toBe(true);
        expect(_vmAddress3).toBe(true);
    });

    it('PWRJS VMDataTxn', async () => {
        const vmDataTxn = await PWRJS.getVMDataTransactions(
            '1000',
            '1002',
            '10023'
        );

        const TxnData = {
            receiver: '10023',
            data: '0x0000014ff9014c8201cd843b9aca0082801394119e7769552157edfc425c4d0667f3c6f56225a280b8e4f7742d2f00000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000008dc54c1df9828000000000000000000000000000000000000000000000000008ac7230489e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000019000000000000000000000000000000000000000000000000000000000000000183636306564313262333031393337386639313332633830370000000000000000824e71a086d816c05e2989feb315f22fe88b97d17e5167d59e9d0894d0359b1162492b02a0261e665f8156d5f5e5f8a22e9d3cc8b894e186c0d41fe610a900cf17c51427f7',
            vmId: 10023,
            fee: 51800,
            type: 'VM Data',
            nonce: 1978,
            positionInTheBlock: 0,
            size: 418,
            sender: '0x93c586f29824d42b4305465a122bf3c949859dd3',
            blockNumber: 1000,
            value: 0,
            hash: '0xd0b2a7a036cd810565f8e6abdd2675ac050970a2cca0e4e600574975456cd371',
            timestamp: 1712247087,
        };

        expect(vmDataTxn[0]).toEqual(TxnData);
    });

    it('Owner of VM', async () => {
        const res = await PWRJS.getOwnerOfVm('111');
        expect(res).toBe(true);
    });

    it('conduits of VM', async () => {
        const conduits = await PWRJS.getConduitsOfVm('111');

        expect(conduits.length).toBe(0);
    });

    // #endregion

    // #region guardian

    // it('txn valid for guardian approval', async () => {
    //     const txns = await PWRJS.getVMDataTransactions('1000', '2000', '10023');

    //     const txnStr = txns[0].rawTransaction;

    //     const isValid = await PWRJS.isTransactionValidForGuardianApproval(
    //         txnStr
    //     );

    //     console.log({
    //         isValid,
    //     });
    // }, 5000);

    it('PWRJS guardian', async () => {
        const noGuardian = await PWRJS.getGuardianOfAddress(testAddress);
        const guardian = await PWRJS.getGuardianOfAddress(
            '0x6EFEC8D7B5DFC4AAC22DA193176A91EB87FE6857'
        );

        expect(noGuardian).toBeNull();
        expect(guardian).toBe('0xF2EE5889989c5206E2bc5f2EF54cCb4cC9bCC292');
    });

    // #endregion

    // #region validator and voting pwr

    it('PWRJS voting pwr', async () => {
        const votingPwr = await PWRJS.getActiveVotingPower();

        expect(votingPwr).toBeGreaterThan(0);
    });

    it('validator', async () => {
        const vAddress = '0xF2EE5889989c5206E2bc5f2EF54cCb4cC9bCC292';
        const validator = await PWRJS.getValidator(vAddress);

        expect(validator.address).toBe(vAddress);
    });

    it('Validators', async () => {
        const allValidators = await PWRJS.getAllValidators();
        const standByValidators = await PWRJS.getStandbyValidators();
        const activeValidators = await PWRJS.getActiveValidators();

        expect(allValidators.length).toBeGreaterThan(0);
        expect(standByValidators.length).toBeGreaterThan(0);
        expect(activeValidators.length).toBeGreaterThan(0);
    });

    it('PWRJS Validators count', async () => {
        const validatorsCount = await PWRJS.getTotalValidatorsCount();
        const standByValidators = await PWRJS.getStandbyValidatorsCount();
        const activeValidators = await PWRJS.getActiveValidatorsCount();
        const delegatorCount = await PWRJS.getTotalDelegatorsCount();

        expect(validatorsCount).toBeGreaterThan(0);
        expect(standByValidators).toBeGreaterThan(0);
        expect(activeValidators).toBeGreaterThan(0);
        expect(delegatorCount).toBeGreaterThan(0);
    });

    it('Delegated pwr', async () => {
        const vAddress = '0xF2EE5889989c5206E2bc5f2EF54cCb4cC9bCC292';
        const res = await PWRJS.getDelegatedPWR(testAddress, vAddress);

        expect(res.delegatedPWR).toBe(0);
    });

    it('share value', async () => {
        const vAddress = '0xe7bd3dc8a88ed50ebca72d6380e5fbbd7bcab75c';

        const res = await PWRJS.getShareValue(vAddress);

        // expect(res.shareValue).toBe(0);
    });

    // #endregiion
});
