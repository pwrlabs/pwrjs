import PWRWallet from '../src/wallet/wallet';

import axios from 'axios';
import BigNumber from 'bignumber.js';
import TransactionBuilder from '../src/protocol/transaction-builder';
import { signTxn } from '../src/utils';

describe('wallet_core', () => {
    const pvk =
        '0x65d39c88806fd85c9a860e1f26155af4321c5aaaf98d5d164bdab13b5e924ffd';
    const pwrWallet = new PWRWallet(pvk);

    const pvkGuardian =
        '0xb8a70832e8fec8f6a0ec4721f5d5b0239834105eb52a606914e61fbe3506d278';
    const guardianWallet = new PWRWallet(pvk);

    const validator = '0x0x6EFEC8D7B5dfC4aaC22Da193176a91Eb87FE6857';

    let nonce = -1;

    const chainId = 0;
    pwrWallet.setChainId(chainId);
    const validatorAddress = '0x8a0e30385bbbebe850b7910bfb98647ebf06bcf0';

    const guardianAddress = '0x8cc1d696a9a69d6345ad2de0a9d9fadecc6ba767';

    console.log('validatorAddress', pwrWallet.getAddress());
    console.log('pvk', pwrWallet.getPrivateKey());

    // beforeAll(async () => {
    //     // faucet it
    //     await axios({
    //         method: 'post',
    //         url: `https://pwrfaucet.pwrlabs.io/claimPWR/?userAddress=${pwrWallet.getAddress()}`,
    //     });

    //     // sleep for 5 seconds
    //     await new Promise((_) => setTimeout(_, 12 * 1000));
    // }, 20 * 1000);

    // #region wallet props

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
        const _nonce = await pwrWallet.getNonce();

        nonce = _nonce;

        console.log({ nonce: _nonce });

        // expect(nonce).toBeGreaterThanOrEqual(0);
        expect(_nonce).toBeGreaterThan(0);
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
            console.log('transferpwr', error);
            expect(false).toBe(true);
        }
    });

    it('successfully joins with an IP and nonce', async () => {
        nonce += 1;

        // NOTE: THE TXN FAILS BECAUSE OF THE NEEDED AMOUNT TO JOIN
        try {
            const tx = await pwrWallet.join('127.1.1.1', nonce);
            console.log('Join transaction successful:', tx.res);
        } catch (e) {
            // console.log('error join', e);
            expect(false).toBe(true);
        }
    });

    // it('claim active node spot', async () => {
    //     nonce += 1;
    //     try {
    //         const tx = await pwrWallet.claimActiveNodeSpot(nonce);
    //         console.log('Transaction successful:', tx);
    //     } catch (e) {
    //         // console.error('Error claiming active node spot:', e);
    //         expect(false).toBe(true);
    //     }
    // });

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

    // it('sends payable VM data  transaction', async () => {
    //     nonce += 1;

    //     const vmId = '100';

    //     const dataBytes = new TextEncoder().encode(
    //         JSON.stringify({ name: 'Test VM Data' })
    //     );

    //     try {
    //         const tx = await pwrWallet.sendPayableVmDataTransaction(
    //             vmId,
    //             '1',
    //             dataBytes,
    //             nonce
    //         );
    //         console.log('VM data transaction successful:', tx.txn.hash);
    //     } catch (e) {
    //         expect(false).toBe(true);
    //         // console.error('Error sending VM data transaction:', e.message);
    //     }
    // });

    // #endregion

    // #region guardians

    // it('sets  guardian ', async () => {
    //     // 7 days from now ms

    //     const futureDate = new Date();
    //     futureDate.setDate(futureDate.getDate() + 7);
    //     const epochTime = Math.floor(futureDate.getTime() / 1000);

    //     nonce += 1;

    //     try {
    //         const tx = await pwrWallet.setGuardian(
    //             guardianAddress,
    //             epochTime,
    //             nonce
    //         );
    //         // console.log('Set guardian transaction successful:', tx.res);
    //     } catch (e) {
    //         expect(false).toBe(true);
    //     }
    // });

    // it('sends a guardian-wrapped transaction', async () => {
    //     const nonceG = await guardianWallet.getNonce();
    //     nonce += 1;

    //     const exampleTxn = {
    //         to: '0x8a0e30385bbbebe850b7910bfb98647ebf06bcf0',
    //         amount: '1',
    //         nonce,
    //         chainId: 0,
    //     };

    //     const txn = TransactionBuilder.getTransferPwrTransaction(
    //         exampleTxn.chainId,
    //         exampleTxn.nonce,
    //         exampleTxn.amount,
    //         exampleTxn.to
    //     );

    //     const signature = signTxn(txn, guardianWallet.getPrivateKey());
    //     const txnBytes = new Uint8Array([...txn, ...signature]);

    //     try {
    //         const tx = await guardianWallet.sendGuardianApprovalTransaction(
    //             [txnBytes],
    //             nonceG
    //         );

    //         console.log('Guardian-wrapped transaction successful:', tx);
    //     } catch (e) {
    //         console.log(e);

    //         expect(false).toBe(true);
    //     }
    // });

    // it('removes a guardian', async () => {
    //     nonce += 1;

    //     try {
    //         const tx = await pwrWallet.removeGuardian(1);
    //         console.log('Remove guardian transaction successful:', tx);
    //     } catch (e) {
    //         expect(false).toBe(true);
    //     }
    // });

    // #endregion

    // #region validators

    it(
        'delegate 1 pwr to validators',
        async () => {
            nonce += 1;

            try {
                const tx = await pwrWallet.delegate(
                    validator,
                    '1000000000',
                    nonce
                );

                await new Promise((resolve) => setTimeout(resolve, 12 * 1000));
                console.log('Delegation transaction successful:', tx.txnHex);
            } catch (error) {
                console.log('delegate', error);
                expect(false).toBe(true);
            }
        },
        20 * 1000
    );

    // it('withdraw 1 share from validators', async () => {
    //     nonce += 1;

    //     try {
    //         const tx = await pwrWallet.withdraw(validator, '1', nonce);
    //     } catch (e) {
    //         // console.log(e);
    //         expect(false).toBe(true);
    //     }
    // });

    // // vm id can be claimed only once, that's why this test is commented
    // it('claims rewards from validators', async () => {
    //     nonce += 1;
    //     try {
    //         const tx = await pwrWallet.claimVmId('68681', nonce);
    //     } catch (e) {
    //         expect(false).toBe(true);
    //     }
    // });

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

    // it('moves stake', async () => {
    //     const validator = '0x1234abcd';
    //     nonce += 1;

    //     try {
    //         const tx = await pwrWallet.moveStake('100', '0x1', '0x2', nonce);
    //         console.log('Move stake transaction successful:', tx);
    //     } catch (e) {
    //         expect(false).toBe(true);
    //     }
    // });

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

    // it('sets a conduit', async () => {
    //     const conduitAddress = '0x8';
    //     nonce += 1;
    //     try {
    //         const tx = await pwrWallet.setConduits(
    //             '1',
    //             [conduitAddress],
    //             nonce
    //         );
    //         console.log('Set conduit transaction successful:', tx.res);
    //     } catch (e) {
    //         expect(false).toBe(true);
    //     }
    // });

    // it('sends a conduit transaction', async () => {
    //     const vmId = 100;
    //     const txnBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    //     nonce += 1;
    //     try {
    //         const tx = await pwrWallet.sendConduitTransaction(
    //             vmId,
    //             txnBytes,
    //             nonce
    //         );
    //         console.log('Conduit transaction successful:', tx);
    //     } catch (e) {
    //         expect(false).toBe(true);
    //     }
    // });

    // #endregion
});
