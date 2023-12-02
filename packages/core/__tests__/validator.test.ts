'use strict';

import Validator from '../src/validator/validator';
import PWRWallet from '../src/wallet/wallet';

import axios from 'axios';
import BigNumber from 'bignumber.js';

describe('validator_core', () => {
    const validatorAddress = '0x61bd8fc1e30526aaf1c4706ada595d6d236d9883';

    const v = new Validator();

    // beforeAll(async () => {
    //     // faucet it
    //     await axios({
    //         method: 'post',
    //         url: `https://pwrfaucet.pwrlabs.io/claimPWR/?userAddress=${pwrWallet.getAddress()}`,
    //     });

    //     // sleep for 5 seconds
    //     await new Promise((_) => setTimeout(_, 12 * 1000));
    // }, 20 * 1000);

    it('set address', () => {
        v.setAddress(validatorAddress);

        expect(v.getAddress()).toBe(validatorAddress);
    });

    it('get delefators', async () => {
        const delegators = await v.getDelegators();

        const addresses = Object.keys(delegators);

        expect(addresses.length).toBeGreaterThan(0);

        // expect(delegators.length).toBeGreaterThan(0);
    });
});
