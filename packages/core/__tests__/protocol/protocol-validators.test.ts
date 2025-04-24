import { describe, test, expect } from 'vitest';

import PWRJS from '../../src/protocol/pwrjs';

import WalletUtils from '../../src/wallet.utils';

import { HttpTypes } from '../../src/entities/http.types';
import {
    AnyFalconTransaction,
    SetGuardianTransaction,
    SetPublicKeyTransaction,
    Transactions,
    TransferTransaction,
} from '../../src/entities/falcon-transaction.entity';

function sleep(timeMs: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeMs);
    });
}

describe('pwrjs core general', () => {
    const url = 'http://46.101.151.203:8085';

    const testAddress = '0xffb927e3e1fd43fc47bd140c817af780241d1b31';
    const validatorAddress = '0x97F476114B8730F3DA5C0B64AFEEFD0EB51F463F';

    const pwrjs = new PWRJS(url);

    function checkBaseValidator(validator: any) {
        expect(validator).toHaveProperty('address');
        expect(validator).toHaveProperty('ip');
        expect(validator).toHaveProperty('votingPower');
        expect(validator).toHaveProperty('totalShares');
        expect(validator).toHaveProperty('delegatorsCount');
        expect(validator).toHaveProperty('status');
    }

    // #region validators

    test('Get validator count limit', async () => {
        const validatorCountLimit = await pwrjs.getValidatorCountLimit();
        expect(validatorCountLimit).toBe(200);
    });

    test('validator slashing fee', async () => {
        const slashingFee = await pwrjs.getValidatorSlashingFee();
        expect(slashingFee).toBe(500);
    });

    test('validator operational fee', async () => {
        const operationalFee = await pwrjs.getValidatorOperationalFee();
        expect(operationalFee).toBe(1000);
    });

    test('validator joining fee', async () => {
        const joiningFee = await pwrjs.getValidatorJoiningFee();
        expect(joiningFee).toBe(1000000000);
    });

    test('Minimum delegating amount', async () => {
        const minDelegatingAmount = await pwrjs.getMinimumDelegatingAmount();
        expect(minDelegatingAmount).toBe(1000000000);
    });

    test(' Validators and delegators count', async () => {
        const validatorsCount = await pwrjs.getTotalValidatorsCount();
        const standByValidators = await pwrjs.getStandbyValidatorsCount();
        const activeValidators = await pwrjs.getActiveValidatorsCount();
        const delegatorCount = await pwrjs.getTotalDelegatorsCount();

        expect(validatorsCount).toBeGreaterThan(1);
        expect(standByValidators).toBe(0);
        expect(activeValidators).toBeGreaterThan(1);
        expect(delegatorCount).toBe(0);
    });

    test('all Validators', async () => {
        const allValidators = await pwrjs.getAllValidators();
        const allStandByValidators = await pwrjs.getStandbyValidators();
        const allActiveValidators = await pwrjs.getActiveValidators();

        expect(allValidators.length).toBeGreaterThan(0);
        expect(allStandByValidators.length).toBe(0);
        expect(allActiveValidators.length).toBeGreaterThan(0);

        for (const v of allValidators) {
            checkBaseValidator(v);
        }

        for (const v of allStandByValidators) {
            checkBaseValidator(v);
        }

        for (const v of allActiveValidators) {
            checkBaseValidator(v);
        }
    });

    test('validator', async () => {
        const validator = await pwrjs.getValidator(validatorAddress);

        checkBaseValidator(validator);
        expect(validator.address.toLowerCase()).toBe(validatorAddress.toLowerCase());
    });

    // test after

    test('get delegatees', async () => {
        const delegatees = await pwrjs.getDelegatees('0x87B84E7FAF722FB906F34E4EB9118F49933E55FA');

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

    // #endregion
});
