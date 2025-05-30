import { describe, test, it, expect, beforeAll, afterAll } from 'vitest';
import PWRWallet from '../src/wallet/wallet';
import { keccak256 } from 'js-sha3';

import axios from 'axios';
import BigNumber from 'bignumber.js';
import TransactionBuilder from '../src/protocol/transaction-builder';
import { bytesToHex, signTxn } from '../src/utils';

function hashTxn(txnBytes: Uint8Array): ArrayBuffer {
    const hashedTxn = keccak256.arrayBuffer(txnBytes);
    return hashedTxn;
}

describe('wallet_core', () => {
    const destinyAddress = '0xe01a20baa4b041a1d0700a43aac2425655d9f256';

    const pvk = '0x3ca459c75f4e5b480de52e665105a7c0256c4a3dd7042f9cbcdf432360fb629b'; // txn are failing

    const pwrWallet = new PWRWallet(pvk);

    const wallet0 = new PWRWallet();

    const pvkGuardian = '0xb8a70832e8fec8f6a0ec4721f5d5b0239834105eb52a606914e61fbe3506d278';
    const guardianWallet = new PWRWallet(pvkGuardian);

    const validator = '0x87B84E7FAF722FB906F34E4EB9118F49933E55FA';
    const validator2 = '0x3ca41ed6a4bf1e838b6b2126a3be77fd07d9f344';

    const chainId = 0;
    pwrWallet.setChainId(chainId);

    const guardianAddress = '0x8cc1d696a9a69d6345ad2de0a9d9fadecc6ba767';

    console.log('validatorAddress', validator);
    console.log('wallet', pwrWallet.getAddress());
    console.log('pvk', pwrWallet.getPrivateKey());

    beforeAll(async () => {
        // faucet it
        await axios({
            method: 'post',
            url: `https://pwrfaucet.pwrlabs.io/claimPWR/?userAddress=${pwrWallet.getAddress()}`,
        });

        // sleep for 5 seconds
        await new Promise((_) => setTimeout(_, 15 * 1000));
    }, 20 * 1000);

    // #region wallet props

    it('Wallet address and public and private key', () => {
        const address = pwrWallet.getAddress();
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
        expect(_nonce).toBeGreaterThanOrEqual(0);
    });

    // #endregion

    // #region transactions

    it('Wallet transfer', async () => {
        const randomBal = Math.round(Math.random() * 10);
        // console.log('randomBal', randomBal);

        try {
            const amount = BigInt(randomBal) * BigInt(10 ** 8);
            const tx = await pwrWallet.transferPWR(destinyAddress, amount.toString());

            console.log('transfer txn:', tx);

            expect(tx.success).toBe(true);
        } catch (error) {
            console.log('transferpwr', error);
            expect(false).toBe(true);
        }

        try {
            const tx2 = await wallet0.transferPWR(
                '0x0000000000000000000000000000000000000000',
                '1'
            );

            expect(tx2.success).toBe(false);
        } catch (error) {
            console.log('error transfer txn', error);
            expect(false).toBe(true);
        }
    });

    // it('txn fee', async () => {
    //     const nonce = await pwrWallet.getNonce();

    //     const txn = TransactionBuilder.getTransferPwrTransaction(
    //         '0x0000000000000000000000000000000000000000',
    //         '1000000000',
    //         nonce,
    //         chainId
    //     );

    //     const signature = signTxn(txn, pwrWallet.getPrivateKey());
    //     const txnBytes = new Uint8Array([...txn, ...signature]);

    //     const txnHex = Buffer.from(txnBytes).toString('hex');
    //     // const hashedTxnFinal = hashTxn(txnBytes);
    //     // const hashedTxnStr = Buffer.from(hashedTxnFinal).toString('hex');

    //     console.log({
    //         txnHex,
    //     });
    // });

    // it('successfully joins with an IP and nonce', async () => {
    //     // NOTE: THE TXN FAILS BECAUSE OF THE NEEDED AMOUNT TO JOIN
    //     try {
    //         const tx = await pwrWallet.join('127.1.1.1');
    //         // console.log('Join transaction :', tx);
    //         expect(tx.success).toBe(true);
    //     } catch (e) {
    //         expect(false).toBe(true);
    //     }
    // });

    // it('claim active node spot', async () => {
    //     try {
    //         const tx = await pwrWallet.claimActiveNodeSpot();
    //         console.log('claim node txn:', tx);
    //         expect(tx.success).toBe(true);
    //     } catch (e) {
    //         // console.error('Error claiming active node spot:', e);
    //         expect(false).toBe(true);
    //     }
    // });

    it('sends VM data transaction', async () => {
        const vidaId = '100';

        const data = JSON.stringify({ setName: 'AhmadHassoun' });

        try {
            const tx = await pwrWallet.sendVMStringDataTxn(vidaId, data);
            // console.log('VM data txn:', tx);
            expect(tx.success).toBe(true);
        } catch (e) {
            expect(false).toBe(true);
            console.error('Error sending VM data transaction:', e.message);
        }
    });

    it('sends vm data bytes transaction', async () => {
        const vidaId = '100';
        const data = {
            setName: 'AhmadHassoun',
        };

        const dataBytes = new TextEncoder().encode(JSON.stringify(data));

        try {
            const tx = await pwrWallet.sendVMDataTxn(vidaId, dataBytes);
            // console.log('VM data bytes txn  :', tx);
            expect(tx.success).toBe(true);
        } catch (e) {
            expect(false).toBe(true);
            // console.error('Error sending VM data transaction:', e.message);
        }
    });

    it('sends payable VM data  transaction', async () => {
        const vidaId = '100';
        const data = '（づ￣3￣）づ╭❤️～';

        const dataBytes = new TextEncoder().encode(data);

        try {
            const tx = await pwrWallet.sendPayableVidaDataTransaction(vidaId, '1', dataBytes);
            // console.log('payable VM data txn:', tx);
            expect(tx.success).toBe(true);
        } catch (e) {
            expect(false).toBe(true);
            // console.error('Error sending VM data transaction:', e.message);
        }
    });

    // #endregion

    // // #region guardians

    // // it('sets  guardian ', async () => {
    // //     // 7 days from now ms

    // //     const futureDate = new Date();
    // //     futureDate.setDate(futureDate.getDate() + 7);
    // //     const epochTime = Math.floor(futureDate.getTime() / 1000);

    // //     try {
    // //         const tx = await pwrWallet.setGuardian(guardianAddress, epochTime);
    // //         console.log('Set guardian txn :', tx);
    // //         expect(tx.success).toBe(true);
    // //     } catch (e) {
    // //         expect(false).toBe(true);
    // //     }
    // // });

    // // it('sends a guardian-wrapped transaction', async () => {
    // //     const _nonce = await pwrWallet.getNonce();

    // //     const exampleTxn = {
    // //         to: '0x8a0e30385bbbebe850b7910bfb98647ebf06bcf0',
    // //         amount: '1',
    // //         nonce: _nonce,
    // //         chainId: 0,
    // //     };

    // //     const txn = TransactionBuilder.getTransferPwrTransaction(
    // //         exampleTxn.chainId,
    // //         exampleTxn.nonce,
    // //         exampleTxn.amount,
    // //         exampleTxn.to
    // //     );

    // //     const signature = signTxn(txn, guardianWallet.getPrivateKey());
    // //     const txnBytes = new Uint8Array([...txn, ...signature]);

    // //     try {
    // //         const tx = await guardianWallet.sendGuardianApprovalTransaction([
    // //             txnBytes,
    // //         ]);

    // //         console.log('Guardian-wrapped txn', tx);

    // //         expect(tx.success).toBe(true);
    // //     } catch (e) {
    // //         expect(false).toBe(true);
    // //     }
    // // });

    // // it('removes a guardian', async () => {
    // //     try {
    // //         const tx = await pwrWallet.removeGuardian();

    // //         console.log('remove guardian txn:', tx);

    // //         expect(tx.success).toBe(true);
    // //     } catch (e) {
    // //         expect(false).toBe(true);
    // //     }
    // // });

    // // #endregion

    // // #region validators

    // it(
    //     'delegate 1 pwr to validators',
    //     async () => {
    //         try {
    //             const tx = await pwrWallet.delegate(validator, '1000000000');

    //             await new Promise((resolve) => setTimeout(resolve, 12 * 1000));

    //             console.log('Delegation txn', tx);

    //             expect(tx.success).toBe(true);
    //         } catch (error) {
    //             expect(false).toBe(true);
    //         }
    //     },
    //     20 * 1000
    // );

    // it('withdraw 1 share from validators', async () => {
    //     try {
    //         const tx = await pwrWallet.withdraw(validator, '1');

    //         console.log('withdraw txn', tx);

    //         expect(tx.success).toBe(true);
    //     } catch (e) {
    //         // console.log(e);
    //         expect(false).toBe(true);
    //     }
    // });

    // vm id can be claimed only once, that's why this test is commented,
    // I checked and it's working
    // it('claims vmid', async () => {
    //     try {
    //         const tx = await pwrWallet.claimVidaId('20');
    //         console.log('claim vmid txn', tx);
    //         expect(tx.success).toBe(true);
    //     } catch (e) {
    //         expect(false).toBe(true);
    //     }
    // });

    // // it('removes a validator', async () => {
    // //     nonce += 1;

    // //     try {
    // //         const tx = await pwrWallet.sendValidatorRemoveTxn(validator, nonce);
    // //         console.log('Validator remove transaction successful:', tx);
    // //     } catch (e) {
    // //         expect(false).toBe(true);
    // //     }
    // // });

    // it('moves stake', async () => {
    //     try {
    //         const tx = await pwrWallet.moveStake('1', validator, validator2);
    //         console.log('Move stake txn :', tx);
    //         expect(tx.success).toBe(true);
    //     } catch (e) {
    //         expect(false).toBe(true);
    //     }
    // });

    // // #endregion

    // // #region conduits

    // // it('withdrawPWR share from validators', async () => {
    // //     // const nonce = await pwrWallet.getNonce();

    // //     try {
    // //         const tx = await pwrWallet.withdrawPWR(validatorAddress, '100', 2);
    // //     } catch (e) {
    // //         console.log(e);
    // //         console.log(e.message);
    // //         console.log(e.data);
    // //     }
    // // });

    // // it('sets a conduit', async () => {
    // //     const conduitAddress = '0x8';
    // //     nonce += 1;
    // //     try {
    // //         const tx = await pwrWallet.setConduits(
    // //             '1',
    // //             [conduitAddress],
    // //             nonce
    // //         );
    // //         console.log('Set conduit transaction successful:', tx.res);
    // //     } catch (e) {
    // //         expect(false).toBe(true);
    // //     }
    // // });

    // // it('sends a conduit transaction', async () => {
    // //     const vidaId = 100;
    // //     const txnBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    // //     nonce += 1;
    // //     try {
    // //         const tx = await pwrWallet.sendConduitTransaction(
    // //             vidaId,
    // //             txnBytes,
    // //             nonce
    // //         );
    // //         console.log('Conduit transaction successful:', tx);
    // //     } catch (e) {
    // //         expect(false).toBe(true);
    // //     }
    // // });

    // // #endregion

    // // #region proposals
    // it('Change Early Withdrawal Penalty', async () => {
    //     try {
    //         // 1 day in seconds
    //         const time = (60 * 60 * 24).toString();
    //         const penalty = 500;

    //         const tx =
    //             await pwrWallet.createProposal_ChangeEarlyWithdrawalPenalty(
    //                 time,
    //                 penalty,
    //                 'example title',
    //                 'lorem ipsum dolor sit amet'
    //             );

    //         console.log('Change Early Withdrawal Penalty txn:', tx);
    //         expect(tx.success).toBe(true);
    //     } catch (e) {
    //         expect(false).toBe(true);
    //     }
    // });

    // it('Change fee per byte proposal', async () => {
    //     try {
    //         const fee = '90';
    //         const tx = await pwrWallet.createProposal_ChangeFeePerByte(
    //             fee,
    //             'example title',
    //             'lorem ipsum dolor sit amet'
    //         );

    //         console.log('Change fee per byte txn:', tx);
    //         expect(tx.success).toBe(true);
    //     } catch (e) {
    //         expect(false).toBe(true);
    //     }
    // });

    // it('Change max block size proposal', async () => {
    //     try {
    //         const size = 26500000;
    //         const tx = await pwrWallet.createProposal_ChangeMaxBlockSize(
    //             size,
    //             'example title',
    //             'lorem ipsum dolor sit amet'
    //         );

    //         console.log('Change max block size txn:', tx);
    //         expect(tx.success).toBe(true);
    //     } catch (e) {
    //         expect(false).toBe(true);
    //     }
    // });

    // it('Change max txn size proposal', async () => {
    //     try {
    //         const size = 16500002;
    //         const tx = await pwrWallet.createProposal_ChangeMaxTxnSizeSize(
    //             size,
    //             'example title',
    //             'lorem ipsum dolor sit amet'
    //         );

    //         console.log('Change max txn size txn:', tx);
    //         expect(tx.success).toBe(true);
    //     } catch (e) {
    //         expect(false).toBe(true);
    //     }
    // });

    // it('Change burn percentage proposal', async () => {
    //     try {
    //         const percentage = 2;
    //         const tx =
    //             await pwrWallet.createProposal_ChangeOverallBurnPercentage(
    //                 percentage,
    //                 'example title',
    //                 'lorem ipsum dolor sit amet'
    //             );

    //         console.log('Change burn percentage txn:', tx);
    //         expect(tx.success).toBe(true);
    //     } catch (e) {
    //         expect(false).toBe(true);
    //     }
    // });

    // it('Change reward per year proposal', async () => {
    //     try {
    //         const reward = BigNumber(1).shiftedBy(9).toString();

    //         const tx = await pwrWallet.createProposal_ChangeRewardPerYear(
    //             reward,
    //             'example title',
    //             'lorem ipsum dolor sit amet'
    //         );

    //         console.log('Change reward per year txn:', tx);
    //         expect(tx.success).toBe(true);
    //     } catch (e) {
    //         expect(false).toBe(true);
    //     }
    // });

    // it('Change validator count limit proposal', async () => {
    //     try {
    //         const limit = 100;
    //         const tx = await pwrWallet.createProposal_ChangeValidatorCountLimit(
    //             limit,
    //             'example title',
    //             'lorem ipsum dolor sit amet'
    //         );

    //         console.log('Change validator count limit txn:', tx);
    //         expect(tx.success).toBe(true);
    //     } catch (e) {
    //         expect(false).toBe(true);
    //     }
    // });

    // it('Change validator joining fee proposal', async () => {
    //     try {
    //         const tx = await pwrWallet.createProposal_ChangeValidatorJoiningFee(
    //             '1',
    //             'example title',
    //             'lorem ipsum dolor sit amet'
    //         );

    //         console.log('Change validator joining fee txn:', tx);
    //         expect(tx.success).toBe(true);
    //     } catch (e) {
    //         expect(false).toBe(true);
    //     }
    // });

    // it('Change vm id claiming fee proposal', async () => {
    //     try {
    //         const fee = '1';
    //         const tx = await pwrWallet.createProposal_ChangeVidaIdClaimingFee(
    //             fee,
    //             'example title',
    //             'lorem ipsum dolor sit amet'
    //         );

    //         console.log('Change vm id claiming fee txn:', tx);
    //         expect(tx.success).toBe(true);
    //     } catch (e) {
    //         expect(false).toBe(true);
    //     }
    // });

    // it('Change vm owner txn fee share proposal', async () => {
    //     try {
    //         const feeShare = 1;
    //         const tx = await pwrWallet.createProposal_ChangeVidaOwnerTxnFeeShare(
    //             feeShare,
    //             'example title',
    //             'lorem ipsum dolor sit amet'
    //         );

    //         console.log('Change vm owner txn fee share txn:', tx);
    //         expect(tx.success).toBe(true);
    //     } catch (e) {
    //         expect(false).toBe(true);
    //     }
    // });

    // it('other proposal', async () => {
    //     try {
    //         const tx = await pwrWallet.createProposal_OtherProposal(
    //             'example title',
    //             'lorem ipsum dolor sit amet'
    //         );

    //         console.log('Other proposal txn:', tx);
    //         expect(tx.success).toBe(true);
    //     } catch (e) {
    //         expect(false).toBe(true);
    //     }
    // });

    // it('vote on proposal ', async () => {
    //     try {
    //         const proposalHash =
    //             '0x245ba05cb007f348e6a401d8aa53e3a1e435d58cbc5ade4b2ba1528c2c8e6687';
    //         const tx = await pwrWallet.voteProposal(proposalHash, 1);
    //         console.log('Vote on proposal txn:', tx);
    //         expect(tx.success).toBe(true);
    //     } catch (e) {
    //         expect(false).toBe(true);
    //     }
    // });

    // // #endregion

    // #region export/import wallet

    let encrypted;
    const password = 'hellokitty';

    it('exports a wallet', async () => {
        const path = require('path');
        const _p = path.resolve(__dirname, 'files');
        const exportedWallet = pwrWallet.storeWallet(password, _p);

        encrypted = exportedWallet;
    });

    it('imports a wallet', async () => {
        const path = require('path');
        const _p = path.resolve(__dirname, 'files');
        const importedWallet = await pwrWallet.loadWallet(password, _p);

        expect(importedWallet.getPrivateKeyHex()).toStrictEqual(pwrWallet.getPrivateKeyHex());
    });

    afterAll(() => {
        const fs = require('fs') as typeof import('fs');
        const path = require('path');
        const _p = path.resolve(__dirname, 'files', 'wallet.dat');
        const exists = fs.existsSync(_p);

        if (exists) fs.rmSync(_p);
    });
});
