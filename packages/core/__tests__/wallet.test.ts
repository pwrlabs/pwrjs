'use strict';

import PWRWallet from '../src/wallet/wallet';

import axios from 'axios';
import BigNumber from 'bignumber.js';

describe('wallet_core', () => {
    const pvk =
        '0xb0f594c8cd413dd80dd324e58ed2d2d39ea2dd523c48b3d013247ebe7b724f4f';
    const pwrWallet = new PWRWallet();
    console.log('wallet', pwrWallet.getAddress());

    const validatorAddress = '0x61bd8fc1e30526aaf1c4706ada595d6d236d9883';

    beforeAll(async () => {
        // faucet it
        await axios({
            method: 'post',
            url: `https://pwrfaucet.pwrlabs.io/claimPWR/?userAddress=${pwrWallet.getAddress()}`,
        });

        // sleep for 5 seconds
        await new Promise((_) => setTimeout(_, 12 * 1000));
    }, 20 * 1000);

    it('Wallet address and public and private key', () => {
        const address = pwrWallet.getAddress();
        const privateKey = pwrWallet.getPrivateKey();
        const publicKey = pwrWallet.getPublicKey();

        const testAddress = /[0-9A-Fa-f]{40}/g;
        const testPvk = /[0-9A-Fa-f]{64}/g;
        const testPbk = /[0-9A-Fa-f]{128}/g;

        expect(testAddress.test(address)).toBe(true);
        expect(testPvk.test(privateKey)).toBe(true);
        expect(testPvk.test(publicKey)).toBe(true);
    });

    // it('Wallet balance', async () => {
    //     const balance = await pwrWallet.getBalance();

    //     expect(balance).toBeGreaterThan(BigNumber(50).shiftedBy(9).toNumber());
    // });

    it('Wallet nonce', async () => {
        const nonce = await pwrWallet.getNonce();

        expect(nonce).toBe(0);
    });

    // it('Wallet transfer', async () => {
    //     const nonce = await pwrWallet.getNonce();

    //     const tx = await pwrWallet.transferPWR(
    //         '0x2712d702a02e5ff5472225d026bfba841349b72e',
    //         '100000000',
    //         nonce
    //     );
    // });

    // it('delegate 1 pwr to validators', async () => {
    //     // const nonce = await pwrWallet.getNonce();
    //     const tx = await pwrWallet.delegate(validatorAddress, '1000000000', 1);
    //     await new Promise((r) => setTimeout(r, 3 * 1000));
    // });

    // it('withdraw 1 pwr from validators', async () => {
    //     // const nonce = await pwrWallet.getNonce();
    //     const tx = await pwrWallet.withdraw(validatorAddress, '1', 2);
    // });
});
