import { describe, test, expect } from 'vitest';

import PWRJS from '../../src/protocol/pwrjs';

import WalletUtils from '../../src/wallet.utils';

function sleep(timeMs: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeMs);
    });
}

describe('pwrjs core general', () => {
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

    test('PWRJS public key', async () => {
        const randomWallet = WalletUtils.getRandomWallet();
        const pk = await pwrjs.getPublicKeyOfAddress(randomWallet.getAddressString());
        expect(pk).toBeNull();
    });

    test('PWRJS nonce', async () => {
        const randomWallet = WalletUtils.getRandomWallet();
        const nonce = await pwrjs.getNonceOfAddress(randomWallet.getAddressString());
        expect(nonce).toBe(0);
    });

    test('PWRJS balance', async () => {
        const randomWallet = WalletUtils.getRandomWallet();
        const balanceOfRandom = await pwrjs.getBalanceOfAddress(randomWallet.getAddressString());
        const balanceOfTest = await pwrjs.getBalanceOfAddress(testAddress);

        expect(balanceOfRandom).toBe(0n);
        expect(balanceOfTest > BigInt(90 * 10 ** 9)).toBe(true);
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

    // test('PWRJS get early withdraw penalty', async () => {
    //     const penalty = await pwrjs.getEarlyWithdrawPenalty();

    //     expect(penalty).toEqual({});
    // });

    // #endregion
});
