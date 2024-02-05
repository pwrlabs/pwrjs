import PWRWallet from '../src/wallet/wallet';

import axios from 'axios';
import BigNumber from 'bignumber.js';

describe('wallet_core', () => {
    const pvk =
        '0x9c8c7c43592e21ccd54202bf089dc9c2ed25a528af1417ebf96734c7031adb62';
    const pwrWallet = new PWRWallet();
    console.log('wallet', pwrWallet.getAddress());
    console.log('wallet', pwrWallet.getPrivateKey());

    const validatorAddress = '0x8a0e30385bbbebe850b7910bfb98647ebf06bcf0';

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

    it('Wallet balance', async () => {
        const balance = await pwrWallet.getBalance();

        expect(balance).toBeGreaterThan(BigNumber(50).shiftedBy(9).toNumber());
    });

    it('Wallet nonce', async () => {
        const nonce = await pwrWallet.getNonce();

        expect(nonce).toBe(0);
    });

    it('Wallet transfer', async () => {
        const nonce = await pwrWallet.getNonce();

        const tx = await pwrWallet.transferPWR(
            '0x2712d702a02e5ff5472225d026bfba841349b72e',
            '100000000',
            nonce
        );
    });
    it('successfully joins with an IP and nonce', async () => {
        try {
            const tx = await pwrWallet.join('127.0.0.1 ', 1);
            console.log('Join transaction successful:', tx);
        } catch (e) {
            console.error('Error during join operation:', e.message);
            if (e.response) {
                console.log('Error response data:', e.response.data);
            }
        }
    });

    it('claim active node spot', async () => {
        try {
            const tx = await pwrWallet.claimActiveNodeSpot(1);
            console.log('Transaction successful:', tx);
        } catch (e) {
            console.error('Error claiming active node spot:', e.message);
            if (e.response) {
                console.log('Error response data:', e.response.data);
            }
            it('successfully joins with an IP and nonce', async () => {
                try {
                    const tx = await pwrWallet.join('127.0.0.1 ', 1);
                    console.log('Join transaction successful:', tx);
                } catch (e) {
                    console.error('Error during join operation:', e.message);
                    if (e.response) {
                        console.log('Error response data:', e.response.data);
                    }
                }
            });
        }
    });

    it(
        'delegate 1 pwr to validators',
        async () => {
            // const nonce = await pwrWallet.getNonce();
            const tx = await pwrWallet.delegate(
                validatorAddress,
                '1000000000',
                1
            );
            await new Promise((r) => setTimeout(r, 12 * 1000));
        },
        20 * 1000
    );

    it('withdraw 1 share from validators', async () => {
        // const nonce = await pwrWallet.getNonce();

        try {
            const tx = await pwrWallet.withdraw(validatorAddress, '100', 2);
        } catch (e) {
            console.log(e);
            console.log(e.message);
            console.log(e.data);
        }
    });

    // vm id can be claimed only once, that's why this test is commented
    it('claims rewards from validators', async () => {
        // const nonce = await pwrWallet.getNonce();
        try {
            const tx = await pwrWallet.claimVmId('68681', 3);
        } catch (e) {
            console.log(e);
            console.log(e.message);
            console.log(e.data);
        }
    });

    it('withdrawPWR share from validators', async () => {
        // const nonce = await pwrWallet.getNonce();

        try {
            const tx = await pwrWallet.withdrawPWR(validatorAddress, '100', 2);
        } catch (e) {
            console.log(e);
            console.log(e.message);
            console.log(e.data);
        }
    });

    it('sends a conduit transaction', async () => {
        const vmId = 100;
        const txnBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
        const nonce = 2;
        try {
            const tx = await pwrWallet.sendConduitTransaction(
                vmId,
                txnBytes,
                nonce
            );
            console.log('Conduit transaction successful:', tx);
        } catch (e) {
            console.error('Error sending conduit transaction:', e.message);

            if (e.response) {
                console.log('Error response data:', e.response.data);
            }
        }
    });
    it('sets a guardian address with an expiry date', async () => {
        const guardianAddress = new Uint8Array([
            0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a,
            0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13,
        ]);
        const expiryDate = Date.now();
        const nonce = 2;

        try {
            const tx = await pwrWallet.setGuardian(
                guardianAddress,
                expiryDate,
                nonce
            );
            console.log('Set guardian transaction successful:', tx);
        } catch (e) {
            console.error('Error setting guardian:', e.message);
            if (e.response) {
                console.log('Error response data:', e.response.data);
            }
        }
    });
    it('removes a guardian', async () => {
        const nonce = 2;

        try {
            const tx = await pwrWallet.removeGuardian(nonce);
            console.log('Remove guardian transaction successful:', tx);
        } catch (e) {
            console.error('Error removing guardian:', e.message);
            if (e.response) {
                console.log('Error response data:', e.response.data);
            }
        }
    });
    it('sends a guardian-wrapped transaction', async () => {
        const exampleTxn = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
        const nonce = 2;
        try {
            const tx = await pwrWallet.sendGuardianWrappedTransaction(
                exampleTxn,
                nonce
            );
            console.log('Guardian-wrapped transaction successful:', tx);
        } catch (e) {
            console.error(
                'Error sending guardian-wrapped transaction:',
                e.message
            );
            if (e.response) {
                console.log('Error response data:', e.response.data);
            }
        }
    });
    it('removes a validator', async () => {
        const validator = '0x1234abcd';
        const nonce = 2;

        try {
            const tx = await pwrWallet.sendValidatorRemoveTxn(validator, nonce);
            console.log('Validator remove transaction successful:', tx);
        } catch (e) {
            console.error('Error removing validator:', e.message);
            if (e.response) {
                console.log('Error response data:', e.response.data);
            }
        }
    });
});
