'use strict';

import PWRWallet from '../src/wallet/wallet';

import WalletUtils from '../src/wallet.utils';
import axios from 'axios';

describe('core', () => {
    const randomWallet = WalletUtils.getRandomWallet();

    const pwrWallet = new PWRWallet(randomWallet.getPrivateKeyString());

    // faucet it
    axios({
        method: 'post',
        url: `https://pwrfaucet.pwrlabs.io/claimPWR/?userAddress=${pwrWallet.getAddress()}`,
    });

    it('Wallet address and private key', () => {
        const address = pwrWallet.getAddress();
        const privateKey = pwrWallet.getPrivateKey();

        // must be 40 hex characters
        const testAddress = /[0-9A-Fa-f]{40}/g;
        const testPk = /[0-9A-Fa-f]{64}/g;

        expect(testAddress.test(address)).toBe(true);
        expect(testPk.test(privateKey)).toBe(true);
    });

    it('Wallet balance', async () => {
        const balance = await pwrWallet.getBalance();

        expect(balance).toBe(0);
    });

    it('Wallet nonce', async () => {
        const nonce = await pwrWallet.getNonce();

        expect(nonce).toBe(0);
    });

    // it('Wallet transfer', async () => {
    //     const nonce = await pwrWallet.getNonce();

    //     const tx = await pwrWallet.transferPWR(
    //         '0x0000000000000000000000000000000000000000',
    //         '1000000000',
    //         nonce
    //     );
    // });
});
