import { describe, test, expect } from 'vitest';

import { PWRWallet } from '../src';
import PWRJS from '../src/protocol/pwrjs';

import WalletUtils from '../src/wallet.utils';

function sleep(timeMs: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeMs);
    });
}

describe('pwrjs core', () => {
    const url = 'https://pwrrpc.pwrlabs.io';

    const testAddress = '0xffb927e3e1fd43fc47bd140c817af780241d1b31';
    const vmAddress = '0x1000000000000000000000000000000000010023';

    const pwrjs = new PWRJS(url);

    // #region pwrjs props

    test('PWRJS set node url', async () => {
        await sleep(2000);

        const nodeUrl = pwrjs.getRpcNodeUrl();
        expect(nodeUrl).toBe(url);
    });

    test('PWRJS fee ', async () => {
        const fee = await pwrjs.getFeePerByte();
        expect(fee).toBe(1000);
    });

    test('PWRJS chain id', async () => {
        const chainId = await pwrjs.getChainId();
        expect(chainId).toBe(0);
    });

    test('PWRJS blockchain version', async () => {
        const blockchainVersion = await pwrjs.getBlockchainVersion();
        expect(blockchainVersion).toBe(1);
    });

    // #endregion

    // #region fee
    test('fee ecsda', async () => {
        const fee = await pwrjs.getEcdsaVerificationFee();
        expect(fee).toBe(100000);
    });

    // #endregion

    // #region wallet methods

    test('PWRJS nonce', async () => {
        const randomWallet = WalletUtils.getRandomWallet();

        const nonce = await pwrjs.getNonceOfAddress(
            randomWallet.getAddressString()
        );

        expect(nonce).toBe(0);
    });

    test('PWRJS balance', async () => {
        const randomWallet = WalletUtils.getRandomWallet();

        const balanceOfRandom = await pwrjs.getBalanceOfAddress(
            randomWallet.getAddressString()
        );

        const balanceOfTest = await pwrjs.getBalanceOfAddress(testAddress);
        expect(balanceOfRandom).toBe(0);
        expect(BigInt(balanceOfTest.toString())).toBeGreaterThan(
            BigInt((90 * 10 ** 9).toString())
        );
    });

    // #endregion

    // #region general

    test('PWRJS burn percentage', async () => {
        const burnPercentage = await pwrjs.getBurnPercentage();
        expect(burnPercentage).toBe(0);
    });

    test('PWRJS total voting power', async () => {
        const totalVotingPower = await pwrjs.getTotalVotingPower();
        expect(totalVotingPower).toBeGreaterThan(0);
    });

    test('PWRJS rewards per year', async () => {
        const rewardsPerYear = await pwrjs.getPwrRewardsPerYear();
        expect(rewardsPerYear).toBe(20000000000000000);
    });

    test('PWRJS withdrawal Lock Time', async () => {
        const withdrawalLockTime = await pwrjs.getWithdrawalLockTime();
        expect(withdrawalLockTime).toBe(604800000);
    });

    test('PWRJS get early withdraw penalty', async () => {
        const penalty = await pwrjs.getEarlyWithdrawPenalty();

        expect(penalty).toEqual({});
    });

    // #endregion

    // #region blocks

    test('PWRJS blocks count', async () => {
        const blocksCount = await pwrjs.getBlocksCount();
        expect(blocksCount).toBeGreaterThan(0);
    });

    test('PWRJS max block size', async () => {
        const maxBlockSize = await pwrjs.getMaxBlockSize();
        expect(maxBlockSize).toBe(5000000);
    });

    test('PWRJS Max Transaction Size', async () => {
        const maxTxnSize = await pwrjs.getMaxTransactionSize();
        expect(maxTxnSize).toBe(2000000);
    });

    test('PWRJS block number', async () => {
        const blockNumber = await pwrjs.getBlockNumber();
        expect(blockNumber).toBeGreaterThan(0);
    });

    test('PWRJS block timestamp', async () => {
        const blockTimestamp = await pwrjs.getBlockTimestamp();
        expect(blockTimestamp).toBeGreaterThan(0);
    });

    test('PWRJS latest block number', async () => {
        const latestBlockNumber = await pwrjs.getLatestBlockNumber();
        expect(latestBlockNumber).toBeGreaterThan(0);
    });

    test('PWRJS block by number', async () => {
        const firstBlock = await pwrjs.getBlockByNumber(3);

        const firstBlockData = {
            blockHash:
                '8cba45cdab2947ac39b88f9138c95a920eb0cb488c4d5f1a88c551d6d3c99ae2',
            size: 1492,
            networkVotingPower: 20000000000000000,
            success: true,
            blockNumber: 3,
            transactionCount: 1,
            blockReward: 0,
            transactions: [
                {
                    isBundled: false,
                    actionFee: 0,
                    receiver: '0x7D55953FF7572C32AF4EC31D2AD6E8E70F61F874',
                    data: '0x',
                    fee: 0,
                    type: 'Falcon Transfer',
                    nonce: 1,
                    positionInTheBlock: 0,
                    size: 722,
                    feePayer: '89d902247185cfd0dc5a61fced9ba0ff7434aa1f',
                    sender: '0x89d902247185cfd0dc5a61fced9ba0ff7434aa1f',
                    success: true,
                    positionInBundle: 0,
                    blockNumber: 3,
                    value: 1002000000000,
                    hash: '0x144bbd1518d966fadd4887794dc11a8badf1ff0dda4bf3ea9e09f60bd12cb654',
                    timestamp: 1738932234063,
                },
            ],
            blockSubmitter: '0x89d902247185cfd0dc5a61fced9ba0ff7434aa1f',
            timestamp: 1738932234063,
        };

        expect(firstBlock).toEqual(firstBlockData);
    });

    // #endregion

    // #region vm

    test('PWRJS vm owner txn fee ', async () => {
        const vmOwnerTxnFee = await pwrjs.getVmOwnerTransactionFeeShare();
        expect(vmOwnerTxnFee).toBe(2500);
    });

    test('PWRJS vm claiming fee', async () => {
        const claimingFee = await pwrjs.getVmIdClaimingFee();
        expect(claimingFee).toBe(100000000000);
    });

    test('PWRJS vmId', async () => {
        const vmId = pwrjs.getVmIdAddress(BigInt(10023));

        expect(vmId).toBe(vmAddress);
    });

    test('PWRJ isVm address', async () => {
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

    // test('PWRJS VMDataTxn', async () => {
    //     const vmDataTxn = await pwrjs.getVMDataTransactions(
    //         '1000',
    //         '1002',
    //         '10023'
    //     );

    //     const TxnData = {
    //         receiver: '10023',
    //         data: '0x0000014ff9014c82064b843b9aca0082801f94119e7769552157edfc425c4d0667f3c6f56225a280b8e4f7742d2f00000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000008dc7e4a9bc0a0a00000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000012c00000000000000000000000000000000000000000000000000000000000000183636353437666630333031393337386639313636323235640000000000000000824e71a0aaeca5c433f69f487d84cd423da6ed0df53a69a648795faddf543b5022fdfe75a044530d65c3d1eb00b16178df495557eea4710088de444d6a945c062be9b66d34',
    //         vmId: 10023,
    //         fee: 51800,
    //         errorMessage: '',
    //         type: 'VM Data',
    //         nonce: 1044,
    //         positionInTheBlock: 2,
    //         rawTransaction: '',
    //         size: 418,
    //         sender: '0x3AD98F914C9233137959D142B93FE71563A21F25',
    //         chainId: 0,
    //         success: true,
    //         blockNumber: 1002,
    //         value: 0,
    //         extraFee: 0,
    //         hash: '0x1367a5a3c3123603f5baf227ad7046f3ddcd6e99423c0d70fe65b051f847a32d',
    //         timestamp: 1716813810,
    //     };

    //     expect(vmDataTxn[0]).toEqual(TxnData);
    // });

    // test('PWRJS Owner of VM', async () => {
    //     const res = await pwrjs.getOwnerOfVm('20');

    //     expect(res.toLowerCase()).toBe(
    //         '0xffb927e3e1fd43fc47bd140c817af780241d1b31'
    //     );
    // });

    // test('conduits of VM', async () => {
    //     const conduits = await pwrjs.getConduitsOfVm('111');

    //     expect(conduits.length).toBeGreaterThan(0);
    // });

    // #endregion

    // #region proposal
    test('PWRJS proposal fee', async () => {
        const fee = await pwrjs.getProposalFee();
        expect(fee).toBe(1000000000);
    });

    test('PWRJS proposal validity time', async () => {
        const validityTime = await pwrjs.getProposalValidityTime();
        expect(validityTime).toBe(604800000);
    });

    // #endregion

    // #region guardian

    test('PWRJS max guardian time', async () => {
        const maxGuardianTime = await pwrjs.getMaxGuardianTime();
        expect(maxGuardianTime).toBe(-1627869184);
    });

    test('PWRJS is valid for guardian approval', async () => {
        const txns = await pwrjs.getVMDataTransactions('1000', '2000', '10023');

        const txn = txns[0];

        // const isValid = await pwrjs.isTransactionValidForGuardianApproval(
        //     txn.rawTransaction
        // );

        console.log(txn);

        // console.log({
        //     isValid,
        // });
    }, 5000);

    test('PWRJS guardian', async () => {
        const randomWallet = new PWRWallet();
        const noGuardian = await pwrjs.getGuardianOfAddress(
            randomWallet.getAddress()
        );
        const guardian = await pwrjs.getGuardianOfAddress(testAddress);

        expect(noGuardian).toBeNull();
        expect(guardian).toBe('0000000000000000000000000000000000000000');
    });

    // #endregion

    // #region validator and voting pwr

    test('PWRJS validator slashing fee', async () => {
        const slashingFee = await pwrjs.getValidatorSlashingFee();
        expect(slashingFee).toBe(500);
    });

    test('PWRJS validator operational fee', async () => {
        const operationalFee = await pwrjs.getValidatorOperationalFee();
        expect(operationalFee).toBe(1000);
    });

    test('PWRJS validator joining fee', async () => {
        const joiningFee = await pwrjs.getValidatorJoiningFee();
        expect(joiningFee).toBe(1000000000000);
    });

    test('PWRJS Minimum delegating amount', async () => {
        const minDelegatingAmount = await pwrjs.getMinimumDelegatingAmount();
        expect(minDelegatingAmount).toBe(1000000000);
    });

    // // test('PWRJS voting pwr', async () => {
    // //     const votingPwr = await PWRJS.getActiveVotingPower();

    // //     expect(votingPwr).toBeGreaterThan(0);
    // // });

    test('PWRJS validator', async () => {
        const vAddress = '0x87B84E7FAF722FB906F34E4EB9118F49933E55FA';
        const validator = await pwrjs.getValidator(vAddress);
        expect(validator.address.toLowerCase()).toBe(
            vAddress.toLowerCase().substring(2)
        );
    });

    test('PWRJS all Validators', async () => {
        const allValidators = await pwrjs.getAllValidators();
        const standByValidators = await pwrjs.getStandbyValidators();
        const activeValidators = await pwrjs.getActiveValidators();

        expect(allValidators.length).toBeGreaterThan(99);
        expect(standByValidators.length).toBe(99);
        expect(activeValidators.length).toBe(32);
    });

    test('PWRJS Validators count', async () => {
        const validatorsCount = await pwrjs.getTotalValidatorsCount();
        const standByValidators = await pwrjs.getStandbyValidatorsCount();
        const activeValidators = await pwrjs.getActiveValidatorsCount();
        const delegatorCount = await pwrjs.getTotalDelegatorsCount();

        expect(validatorsCount).toBe(131);
        expect(standByValidators).toBe(99);
        expect(activeValidators).toBe(32);
        expect(delegatorCount).toBe(32);
    });

    test('PWRJS get delegatees', async () => {
        const delegatees = await pwrjs.getDelegatees(
            '0x87B84E7FAF722FB906F34E4EB9118F49933E55FA'
        );

        expect(delegatees.length).toBeGreaterThan(0);
    });

    test('PWRJS Delegated pwr', async () => {
        const vAddress = '0x87B84E7FAF722FB906F34E4EB9118F49933E55FA';
        const res = await pwrjs.getDelegatedPWR(testAddress, vAddress);

        expect(res).toBe(0);
    });

    test('PWRJS shares of delegator', async () => {
        const dAddress = testAddress;
        const vAddress = '0x87B84E7FAF722FB906F34E4EB9118F49933E55FA';
        const res = await pwrjs.getSharesOfDelegator(dAddress, vAddress);
    });

    test('PWRJS share value', async () => {
        const vAddress = '0x87B84E7FAF722FB906F34E4EB9118F49933E55FA';

        const res = await pwrjs.getShareValue(vAddress);

        expect(res.shareValue).toBe(1.0e-9);
    });

    // #endregiion
});
