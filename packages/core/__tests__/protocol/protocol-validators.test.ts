import { describe, test, expect } from 'vitest';
import * as bip39 from 'bip39';

import PWRJS from '../../src/protocol/pwrjs';

import Falcon512Wallet from '../../src/wallet/falcon-512-wallet';

import DeterministicSecureRandom from '../../src/services/secure-random.service';
import { hexToBytes } from '@noble/hashes/utils';

const path = require('path') as typeof import('path');
const fs = require('fs') as typeof import('fs');

function restoreWallet(): {
    pk: Uint8Array;
    address: string;
    sk: Uint8Array;
    randomBytes: Uint8Array;
} {
    const filePath = path.resolve(__dirname, '..', 'files', 'seed.json');
    const content = fs.readFileSync(filePath, 'utf-8');
    const { pk, sk, address, mnemonic } = JSON.parse(content) as {
        pk: string;
        sk: string;
        address: string;
        mnemonic: string;
    };

    const seed = bip39.mnemonicToSeedSync(mnemonic, '');

    const randomBytesGenerator = new DeterministicSecureRandom(seed);
    const randomBytes = randomBytesGenerator.nextBytes(48);

    return {
        pk: Uint8Array.from(hexToBytes(pk)),
        sk: Uint8Array.from(hexToBytes(sk)),
        address,
        randomBytes,
    };
}

describe('pwrjs core general', async () => {
    const url = 'https://pwrrpc.pwrlabs.io';

    const testAddress = '0xe68191b7913e72e6f1759531fbfaa089ff02308a';
    const validatorAddress = '0xF5FE6AE4BA7AA68C1AB340652D243B899859075B';

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
        expect(standByValidators).toBeGreaterThanOrEqual(0);
        expect(activeValidators).toBeGreaterThanOrEqual(1);
        expect(delegatorCount).toBeGreaterThanOrEqual(0);
    });

    test('all Validators', async () => {
        const allValidators = await pwrjs.getAllValidators();
        const allStandByValidators = await pwrjs.getStandbyValidators();
        const allActiveValidators = await pwrjs.getActiveValidators();

        expect(allValidators.length).toBeGreaterThan(0);
        expect(allStandByValidators.length).toBeGreaterThanOrEqual(0);
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
        const delegatees = await pwrjs.getDelegatees(testAddress);

        expect(delegatees.length).toBeGreaterThan(0);
    });

    test('Get delegated pwr', async () => {
        const res = await pwrjs.getDelegatedPWR(testAddress, validatorAddress);

        expect(res).toBeGreaterThanOrEqual(0);
    });

    test('PWRJS shares of delegator', async () => {
        const res = await pwrjs.getSharesOfDelegator(testAddress, validatorAddress);

        console.log('Shares of delegator: ', res);
    });

    test('PWRJS share value', async () => {
        const res = await pwrjs.getShareValue(validatorAddress);

        expect(res).toBeGreaterThan(0);
    });

    // comment this section to avoid affecting the testnet
    // #region delegate

    const w = restoreWallet();
    const wallet = await Falcon512Wallet.fromKeys(w.sk, w.pk, pwrjs);

    // test('PWRJS delegate', async () => {
    //     const vaddress = '0xf5fe6ae4ba7aa68c1ab340652d243b899859075b';

    //     const amount = 1_000_000_000n;
    //     try {
    //         const res = await wallet.delegate(vaddress, amount);

    //         console.log('Delegate res: ', res);

    //         expect(res.success).toBe(true);
    //     } catch (e) {
    //         console.log('Error: ', e);
    //         expect(false).toBe(true);
    //     }
    // });

    // #endregion

    // #endregion
});
