import { describe, test, expect } from 'vitest';

import PWRJS from '../../src/protocol/pwrjs';

import { HttpTypes } from '../../src/entities/http.types';
import Falcon512Wallet from '../../src/wallet/falcon-512-wallet';

function sleep(timeMs: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeMs);
    });
}

describe('pwrjs core general', async () => {
    const url = 'http://46.101.151.203:8085';

    const testAddress = '0xe68191b7913e72e6f1759531fbfaa089ff02308a';
    const vmAddress = '0x1000000000000000000000000000000000010023';

    const pwrjs = new PWRJS(url);

    const randomWallet = await Falcon512Wallet.new(pwrjs);

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
        const pk = await pwrjs.getPublicKeyOfAddress(randomWallet.getAddress());
        expect(pk).toBeNull();
    });

    test('PWRJS nonce', async () => {
        const nonce = await pwrjs.getNonceOfAddress(randomWallet.getAddress());
        expect(nonce).toBe(0);
    });

    test('PWRJS balance', async () => {
        const balanceOfRandom = await pwrjs.getBalanceOfAddress(randomWallet.getAddress());
        const balanceOfTest = await pwrjs.getBalanceOfAddress(testAddress);

        console.log({ balanceOfRandom, balanceOfTest });

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

    test('Active voting pwr', async () => {
        const activeVotingPwr = await pwrjs.getActiveVotingPower();
        expect(activeVotingPwr).toBeTypeOf('number');
    });

    test('PWRJS get early withdraw penalty', async () => {
        const res = await pwrjs.getEarlyWithdrawPenalty(1);

        expect(res.earlyWithdrawAvailable).toEqual(false);
    });

    test('All early withdraw penalties', async () => {
        const res: HttpTypes.AllEarlyWithdrawPenaltiesResponse =
            await pwrjs.getAllEarlyWithdrawPenalties();
        // const asd: HttpTypes.AllEarlyWithdrawPenaltiesResponse = res;

        expect(res.earlyWithdrawPenalties).toBeDefined();
    });

    // #endregion
});
