import PWRJS from '../src/protocol/pwrjs';

import WalletUtils from '../src/wallet.utils';

function sleep(timeMs: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeMs);
    });
}

describe('pwrjs core', () => {
    const url = 'https://pwrrpc.pwrlabs.io';

    const testAddress = '0xe47d5f4c1731c3c0ea0a75872593cbf61f2cbf90';
    const vmAddress = '0x1000000000000000000000000000000000010023';

    const pwrjs = new PWRJS(url);

    // #region pwrjs props

    it('PWRJS set node url', async () => {
        await sleep(2000);

        const nodeUrl = pwrjs.getRpcNodeUrl();
        expect(nodeUrl).toBe(url);
    });

    it('PWRJS fee ', async () => {
        const fee = await pwrjs.getFeePerByte();
        expect(fee).toBe(100);
    });

    it('PWRJS chain id', async () => {
        const chainId = await pwrjs.getChainId();
        expect(chainId).toBe(0);
    });

    it('PWRJS blockchain version', async () => {
        const blockchainVersion = await pwrjs.getBlockchainVersion();
        expect(blockchainVersion).toBe(1);
    });

    // #endregion

    // #region fee
    it('fee ecsda', async () => {
        const fee = await pwrjs.getEcdsaVerificationFee();
        expect(fee).toBe(10000);
    });

    // #endregion

    // #region wallet methods

    it('PWRJS nonce', async () => {
        const randomWallet = WalletUtils.getRandomWallet();

        const nonce = await pwrjs.getNonceOfAddress(
            randomWallet.getAddressString()
        );

        expect(nonce).toBe(0);
    });

    it('PWRJS balance', async () => {
        const randomWallet = WalletUtils.getRandomWallet();

        const balanceOfRandom = await pwrjs.getBalanceOfAddress(
            randomWallet.getAddressString()
        );

        const balanceOfTest = await pwrjs.getBalanceOfAddress(testAddress);
        expect(balanceOfRandom).toBe(0);
        expect(balanceOfTest.toString()).toBe((100 * 10 ** 9).toString());
    });

    // #endregion

    // #region general

    it('PWRJS burn percentage', async () => {
        const burnPercentage = await pwrjs.getBurnPercentage();
        expect(burnPercentage).toBe(0);
    });

    it('PWRJS total voting power', async () => {
        const totalVotingPower = await pwrjs.getTotalVotingPower();
        expect(totalVotingPower).toBeGreaterThan(0);
    });

    it('PWRJS rewards per year', async () => {
        const rewardsPerYear = await pwrjs.getPwrRewardsPerYear();
        expect(rewardsPerYear).toBe(10000000000000);
    });

    it('PWRJS withdrawal Lock Time', async () => {
        const withdrawalLockTime = await pwrjs.getWithdrawalLockTime();
        expect(withdrawalLockTime).toBe(604800);
    });

    it('PWRJS get early withdraw penalty', async () => {
        const penalty = await pwrjs.getEarlyWithdrawPenalty();

        expect(penalty).toEqual({ 12: 21 });
    });

    // #endregion

    // #region blocks

    it('PWRJS blocks count', async () => {
        const blocksCount = await pwrjs.getBlocksCount();
        expect(blocksCount).toBeGreaterThan(0);
    });

    it('PWRJS max block size', async () => {
        const maxBlockSize = await pwrjs.getMaxBlockSize();
        expect(maxBlockSize).toBe(50000000);
    });

    it('PWRJS Max Transaction Size', async () => {
        const maxTxnSize = await pwrjs.getMaxTransactionSize();
        expect(maxTxnSize).toBe(16500000);
    });

    it('PWRJS block number', async () => {
        const blockNumber = await pwrjs.getBlockNumber();
        expect(blockNumber).toBeGreaterThan(0);
    });

    it('PWRJS block timestamp', async () => {
        const blockTimestamp = await pwrjs.getBlockTimestamp();
        expect(blockTimestamp).toBeGreaterThan(0);
    });

    it('PWRJS latest block number', async () => {
        const latestBlockNumber = await pwrjs.getLatestBlockNumber();
        expect(latestBlockNumber).toBeGreaterThan(0);
    });

    it('PWRJS block by number', async () => {
        const firstBlock = await pwrjs.getBlockByNumber(1);

        const firstBlockData = {
            processedWithoutCriticalErrors: true,
            blockHash:
                '0x7854c95c2f2a9dd370a047d1cb4bdfd20063026ed627778d45f9a9ab634439e1',
            networkVotingPower: 1188673344000000,
            blockNumber: 1,
            blockReward: 0,
            transactionCount: 1,
            transactions: [
                {
                    positionInTheBlock: 0,
                    size: 99,
                    receiver: '0x61BD8FC1E30526AAF1C4706ADA595D6D236D9881',
                    sender: '0x61BD8FC1E30526AAF1C4706ADA595D6D236D9883',
                    success: true,
                    fee: 19900,
                    paid: false,
                    type: 'Transfer',
                    nonce: 1,
                    value: 1001010000000,
                    extraFee: 0,
                    hash: '0xe4326ad01c979981c392ab9bef254a1019f9b21f930d524241541e70cd59bd49',
                },
            ],
            blockSubmitter: '0x61BD8FC1E30526AAF1C4706ADA595D6D236D9883',
            blockSize: 228,
            timestamp: 1716791808,
        };

        expect(firstBlock).toEqual(firstBlockData);
    });

    // #endregion

    // #region vm

    it('PWRJS vm owner txn fee ', async () => {
        const vmOwnerTxnFee = await pwrjs.getVmOwnerTransactionFeeShare();
        expect(vmOwnerTxnFee).toBe(1500);
    });

    it('PWRJS vm claiming fee', async () => {
        const claimingFee = await pwrjs.getVmIdClaimingFee();
        expect(claimingFee).toBe(100000000);
    });

    // it('PWRJS vmId', async () => {
    //     const vmId = PWRJS.getVmIdAddress(10023);

    //     expect(vmId).toBe(vmAddress);
    // });

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
        const vmDataTxn = await pwrjs.getVMDataTransactions(
            '1000',
            '1002',
            '10023'
        );

        const TxnData = {
            receiver: '10023',
            data: '0x0000014ff9014c82064b843b9aca0082801f94119e7769552157edfc425c4d0667f3c6f56225a280b8e4f7742d2f00000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000008dc7e4a9bc0a0a00000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000012c00000000000000000000000000000000000000000000000000000000000000183636353437666630333031393337386639313636323235640000000000000000824e71a0aaeca5c433f69f487d84cd423da6ed0df53a69a648795faddf543b5022fdfe75a044530d65c3d1eb00b16178df495557eea4710088de444d6a945c062be9b66d34',
            vmId: 10023,
            fee: 51800,
            errorMessage: '',
            type: 'VM Data',
            nonce: 1044,
            positionInTheBlock: 2,
            rawTransaction: '',
            size: 418,
            sender: '0x3AD98F914C9233137959D142B93FE71563A21F25',
            chainId: 0,
            success: true,
            blockNumber: 1002,
            value: 0,
            extraFee: 0,
            hash: '0x1367a5a3c3123603f5baf227ad7046f3ddcd6e99423c0d70fe65b051f847a32d',
            timestamp: 1716813810,
        };

        expect(vmDataTxn[0]).toEqual(TxnData);
    });

    it('PWRJS Owner of VM', async () => {
        const owner = await pwrjs.getOwnerOfVm('100');

        expect(owner).toBe('0x7892917ee2B05E2C9661399125D090F6d52b2031');
    });

    it('conduits of VM', async () => {
        const conduits = await pwrjs.getConduitsOfVm('111');

        expect(conduits.length).toBeGreaterThan(0);
    });

    // #endregion

    // #region proposal
    it('PWRJS proposal fee', async () => {
        const fee = await pwrjs.getProposalFee();
        expect(fee).toBe(0);
    });

    it('PWRJS proposal validity time', async () => {
        const validityTime = await pwrjs.getProposalValidityTime();
        expect(validityTime).toBe(604800);
    });

    // #endregion

    // #region guardian

    it('PWRJS max guardian time', async () => {
        const maxGuardianTime = await pwrjs.getMaxGuardianTime();
        expect(maxGuardianTime).toBe(0);
    });

    it('PWRJS is valid for guardian approval', async () => {
        const txns = await pwrjs.getVMDataTransactions('1000', '2000', '10023');

        const txn = txns[0];

        const isValid = await pwrjs.isTransactionValidForGuardianApproval(
            txn.rawTransaction
        );

        console.log(isValid);

        // console.log({
        //     isValid,
        // });
    }, 5000);

    it('PWRJS guardian', async () => {
        const noGuardian = await pwrjs.getGuardianOfAddress(testAddress);
        const guardian = await pwrjs.getGuardianOfAddress(
            '0x6EFEC8D7B5DFC4AAC22DA193176A91EB87FE6857'
        );

        expect(noGuardian).toBeNull();
        expect(guardian).toBe('0xF2EE5889989c5206E2bc5f2EF54cCb4cC9bCC292');
    });

    // #endregion

    // #region validator and voting pwr

    it('PWRJS validator slashing fee', async () => {
        const slashingFee = await pwrjs.getValidatorSlashingFee();
        expect(slashingFee).toBe(0);
    });

    it('PWRJS validator operational fee', async () => {
        const operationalFee = await pwrjs.getValidatorOperationalFee();
        expect(operationalFee).toBe(100);
    });

    it('PWRJS validator joining fee', async () => {
        const joiningFee = await pwrjs.getValidatorJoiningFee();
        expect(joiningFee).toBe(1000000000000);
    });

    it('PWRJS Minimum delegating amount', async () => {
        const minDelegatingAmount = await pwrjs.getMinimumDelegatingAmount();
        expect(minDelegatingAmount).toBe(10000000);
    });
    // it('PWRJS voting pwr', async () => {
    //     const votingPwr = await PWRJS.getActiveVotingPower();

    //     expect(votingPwr).toBeGreaterThan(0);
    // });

    it('PWRJS validator', async () => {
        const vAddress = '0x7111434F00E6C66616fc25cff3Fa080cdb95562B';
        const validator = await pwrjs.getValidator(vAddress);
        expect(validator.address).toBe(vAddress);
    });

    it('PWRJS all Validators', async () => {
        const allValidators = await pwrjs.getAllValidators();
        const standByValidators = await pwrjs.getStandbyValidators();
        const activeValidators = await pwrjs.getActiveValidators();

        expect(allValidators.length).toBeGreaterThan(0);
        expect(standByValidators.length).toBe(0);
        expect(activeValidators.length).toBeGreaterThan(0);
    });

    it('PWRJS Validators count', async () => {
        const validatorsCount = await pwrjs.getTotalValidatorsCount();
        const standByValidators = await pwrjs.getStandbyValidatorsCount();
        const activeValidators = await pwrjs.getActiveValidatorsCount();
        const delegatorCount = await pwrjs.getTotalDelegatorsCount();

        expect(validatorsCount).toBe(40);
        expect(standByValidators).toBe(0);
        expect(activeValidators).toBe(40);
        expect(delegatorCount).toBe(43);
    });

    it('PWRJS get delegatees', async () => {
        const delegatees = await pwrjs.getDelegatees(
            '0x61Bd8fc1e30526Aaf1C4706Ada595d6d236d9883'
        );

        expect(delegatees.length).toBeGreaterThan(0);
    });

    it('PWRJS Delegated pwr', async () => {
        const vAddress = '0xF2EE5889989c5206E2bc5f2EF54cCb4cC9bCC292';
        const res = await pwrjs.getDelegatedPWR(testAddress, vAddress);

        expect(res.delegatedPWR).toBe(0);
    });

    it('PWRJS shares of delegator', async () => {
        const dAddress = '0x61Bd8fc1e30526Aaf1C4706Ada595d6d236d9883';
        const vAddress = '0xF2EE5889989c5206E2bc5f2EF54cCb4cC9bCC292';
        const res = await pwrjs.getSharesOfDelegator(dAddress, vAddress);

        console.log(res);
    });

    it('PWRJS share value', async () => {
        const vAddress = '0xe7bd3dc8a88ed50ebca72d6380e5fbbd7bcab75c';

        const res = await pwrjs.getShareValue(vAddress);

        expect(res.shareValue).toBe(0);
    });

    // #endregiion
});
