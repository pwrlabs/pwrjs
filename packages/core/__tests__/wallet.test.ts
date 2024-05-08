import PWRWallet, { generateTxnBytes } from '../src/wallet/wallet';

import axios from 'axios';
import BigNumber from 'bignumber.js';

describe('wallet_core', () => {
    const pvk =
        '0x65d39c88806fd85c9a860e1f26155af4321c5aaaf98d5d164bdab13b5e924ffd';
    const pwrWallet = new PWRWallet();

    let nonce = -1;

    const chainId = 0;
    pwrWallet.setChainId(chainId);
    const validatorAddress = '0x8a0e30385bbbebe850b7910bfb98647ebf06bcf0';
    console.log('validatorAddress', pwrWallet.getAddress());
    console.log('pvk', pwrWallet.getPrivateKey());

    beforeAll(async () => {
        // faucet it
        await axios({
            method: 'post',
            url: `https://pwrfaucet.pwrlabs.io/claimPWR/?userAddress=${pwrWallet.getAddress()}`,
        });

        // sleep for 5 seconds
        await new Promise((_) => setTimeout(_, 12 * 1000));
    }, 20 * 1000);

    // #region wallet props

    it('test', () => {
        const res = generateTxnBytes(
            1,
            0,
            0,
            '1000000000',
            '0x0000000000000000000000000000000000000000'
        );

        console.log('res', res);
    });

    it('Wallet address and public and private key', () => {
        const address = pwrWallet.getAddress();
        console.log('address', address);
        const privateKey = pwrWallet.getPrivateKey();
        const publicKey = pwrWallet.getPublicKey();

        const testAddress = /[0-9A-Fa-f]{40}/g;
        const testPvk = /[0-9A-Fa-f]{64}/g;
        const testPbk = /[0-9A-Fa-f]{128}/g;

        expect(testAddress.test(address)).toBe(true);
        expect(testPvk.test(privateKey)).toBe(true);
        expect(testPbk.test(publicKey)).toBe(true);
    });

    it('Wallet balance', async () => {
        const balance = await pwrWallet.getBalance();
        expect(balance).toBeGreaterThan(BigNumber(50).shiftedBy(9).toNumber());
    });

    it('Wallet nonce', async () => {
        const nonce = await pwrWallet.getNonce();

        // expect(nonce).toBeGreaterThanOrEqual(0);
        expect(nonce).toBe(0);
    });
    // #endregion

    // #region transactions

    it('Wallet transfer', async () => {
        nonce += 1;
        try {
            const tx = await pwrWallet.transferPWR(
                '0xf8ef0db764721627e00e840c713c88e278a596d2',
                '1',
                nonce
            );
            console.log('Transfer transaction successful:', tx.txn.hash);
        } catch (error) {
            // console.log(error);
            expect(false).toBe(true);
        }
    });

    it('successfully joins with an IP and nonce', async () => {
        nonce += 1;
        try {
            const tx = await pwrWallet.join('127.1.1.1', nonce);
            console.log('Join transaction successful:', tx.res);
        } catch (e) {
            // console.log(e);
            expect(false).toBe(true);
        }
    });

    it('claim active node spot', async () => {
        nonce += 1;
        try {
            const tx = await pwrWallet.claimActiveNodeSpot(nonce);
            console.log('Transaction successful:', tx);
        } catch (e) {
            // console.error('Error claiming active node spot:', e);
            expect(false).toBe(true);
        }
    });

    it('sends VM data transaction', async () => {
        nonce += 1;

        const vmId = '100';

        const dataBytes = new TextEncoder().encode(
            JSON.stringify({ name: 'Test VM Data' })
        );

        try {
            const tx = await pwrWallet.sendVMDataTxn(vmId, dataBytes, nonce);
            console.log('VM data transaction successful:', tx.txn.hash);
        } catch (e) {
            expect(false).toBe(true);
            // console.error('Error sending VM data transaction:', e.message);
        }
    });

    it('sends payable VM data  transaction', async () => {
        nonce += 1;

        const vmId = '100';

        const dataBytes = new TextEncoder().encode(
            JSON.stringify({ name: 'Test VM Data' })
        );

        try {
            const tx = await pwrWallet.sendPayableVmDataTransaction(
                vmId,
                '1',
                dataBytes,
                nonce
            );
            console.log('VM data transaction successful:', tx.txn.hash);
        } catch (e) {
            expect(false).toBe(true);
            // console.error('Error sending VM data transaction:', e.message);
        }
    });

    // #endregion

    // #region guardians

    it('sets  guardian ', async () => {
        const guardianAddress = new Uint8Array([
            0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a,
            0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13,
        ]);

        // 7 days from now
        const expiryDate = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

        nonce += 1;

        try {
            const tx = await pwrWallet.setGuardian(
                guardianAddress,
                expiryDate,
                nonce
            );
            console.log('Set guardian transaction successful:', tx.res);
        } catch (e) {
            expect(false).toBe(true);
        }
    });

    it('sends a guardian-wrapped transaction', async () => {
        const exampleTxn = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
        nonce += 1;
        try {
            const tx = await pwrWallet.sendGuardianApprovalTransaction(
                exampleTxn,
                nonce
            );
            console.log('Guardian-wrapped transaction successful:', tx);
        } catch (e) {
            expect(false).toBe(true);
        }
    });

    it('removes a guardian', async () => {
        nonce += 1;

        try {
            const tx = await pwrWallet.removeGuardian(1);
            console.log('Remove guardian transaction successful:', tx);
        } catch (e) {
            expect(false).toBe(true);
        }
    });

    // #endregion

    // #region validators

    it(
        'delegate 1 pwr to validators',
        async () => {
            nonce += 1;
            const validator = '0x61BD8FC1E30526AAF1C4706ADA595D6D236D9883';
            try {
                const tx = await pwrWallet.delegate(
                    validator,
                    '1000000000',
                    nonce
                );

                await new Promise((resolve) => setTimeout(resolve, 12 * 1000));
                console.log('Delegation transaction successful:', tx.txnHex);
            } catch (error) {
                expect(false).toBe(true);
            }
        },
        20 * 1000
    );

    it('withdraw 1 share from validators', async () => {
        nonce += 1;

        try {
            const tx = await pwrWallet.withdraw(validatorAddress, '1', nonce);
        } catch (e) {
            expect(false).toBe(true);
        }
    });

    // vm id can be claimed only once, that's why this test is commented
    it('claims rewards from validators', async () => {
        nonce += 1;
        try {
            const tx = await pwrWallet.claimVmId('68681', nonce);
        } catch (e) {
            expect(false).toBe(true);
        }
    });

    it('removes a validator', async () => {
        const validator = '0x1234abcd';
        nonce += 1;

        try {
            const tx = await pwrWallet.sendValidatorRemoveTxn(validator, nonce);
            console.log('Validator remove transaction successful:', tx);
        } catch (e) {
            expect(false).toBe(true);
        }
    });

    it('moves stake', async () => {
        const validator = '0x1234abcd';
        nonce += 1;

        try {
            const tx = await pwrWallet.moveStake('100', '0x1', '0x2', nonce);
            console.log('Move stake transaction successful:', tx);
        } catch (e) {
            expect(false).toBe(true);
        }
    });

    // #endregion

    // #region conduits

    // it('withdrawPWR share from validators', async () => {
    //     // const nonce = await pwrWallet.getNonce();

    //     try {
    //         const tx = await pwrWallet.withdrawPWR(validatorAddress, '100', 2);
    //     } catch (e) {
    //         console.log(e);
    //         console.log(e.message);
    //         console.log(e.data);
    //     }
    // });

    it('sets a conduit', async () => {
        const conduitAddress = '0x8';
        nonce += 1;
        try {
            const tx = await pwrWallet.setConduits(
                '1',
                [conduitAddress],
                nonce
            );
            console.log('Set conduit transaction successful:', tx.res);
        } catch (e) {
            expect(false).toBe(true);
        }
    });

    it('sends a conduit transaction', async () => {
        const vmId = 100;
        const txnBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
        nonce += 1;
        try {
            const tx = await pwrWallet.sendConduitTransaction(
                vmId,
                txnBytes,
                nonce
            );
            console.log('Conduit transaction successful:', tx);
        } catch (e) {
            expect(false).toBe(true);
        }
    });

    // #endregion
});
