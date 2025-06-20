import { describe, test, expect, afterAll, beforeAll } from 'vitest';

import BigNumber from 'bignumber.js';
import PWRWallet from '../src/wallet/pwr-wallet-n';
import PWRJS from '../src/protocol/pwrjs';
import FalconService from '../src/services/falcon/falcon-node.service';
import { hexToBytes, bytesToHex } from '../src/utils';
import { DeterministicSecureRandom } from '../services';
import { falconKeypair } from 'rust-falcon';

import * as bip39 from 'bip39';

const path = require('path') as typeof import('path');
const fs = require('fs') as typeof import('fs');

// const RPC = 'http://46.101.151.203:8085';
const RPC = 'https://pwrrpc.pwrlabs.io';

async function generateWallet() {
    const mnemonic = bip39.generateMnemonic();
    const seed = bip39.mnemonicToSeedSync(mnemonic, '');
    const randomBytes = new DeterministicSecureRandom(seed).nextBytes(48);
    const keypair = falconKeypair(randomBytes);

    const pwr = new PWRJS(RPC);
    const falconWallet = await PWRWallet.fromKeys(keypair.secret, keypair.public, pwr);

    const pk = falconWallet.getPublicKey();
    const sk = falconWallet.getPrivateKey();
    const address = falconWallet.getAddress();

    const pkHex = Buffer.from(pk).toString('hex');
    const skHex = Buffer.from(sk).toString('hex');

    const content = JSON.stringify({ pk: pkHex, sk: skHex, address, mnemonic });
    const filePath = path.resolve(__dirname, 'files', 'seed.json');
    fs.writeFileSync(filePath, content);
}

function restoreWallet(): {
    pk: Uint8Array;
    address: string;
    sk: Uint8Array;
    randomBytes: Uint8Array;
} {
    const filePath = path.resolve(__dirname, 'files', 'seed.json');
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

describe('wallet core', async () => {
    // await generateWallet().then(() => {
    //     throw new Error('wallet gen');
    // });
    const w = restoreWallet();
    const ogAddress = w.address;

    const pwr = new PWRJS(RPC);
    const falconWallet = await PWRWallet.fromKeys(w.sk, w.pk, pwr);
    let wallet0: PWRWallet;

    const encoder = new TextEncoder();

    test('init wallet', async () => {
        wallet0 = await PWRWallet.new(pwr);

        const address = falconWallet.getAddress();
        expect(address).toMatch(/[0-9A-Fa-f]{40}/g);

        const pubkey = falconWallet.getPublicKey();
        expect(pubkey).toBeInstanceOf(Uint8Array);

        console.log({ wallet: address });
    });

    test('ensure wallet is restored', async () => {
        const address = falconWallet.getAddress();
        expect(address).toBe(ogAddress);
    });

    test('sign', async () => {
        const data = new TextEncoder().encode('hello world');
        const signature = await falconWallet.sign(data);

        const valid = await FalconService.verify(data, falconWallet.getPublicKey(), signature);
        const valid2 = await falconWallet.verifySignature(data, signature);

        console.log({ valid, valid2 });

        expect(signature).toBeInstanceOf(Uint8Array);
        expect(valid).toBe(true);
        expect(valid2).toBe(true);
    });

    test(
        'Wallet balance',
        async () => {
            const balance = await pwr.getBalanceOfAddress(falconWallet.getAddress());

            const balanceBN = new BigNumber(balance.toString());

            console.log(`Balance: ${balanceBN.shiftedBy(-9).toNumber()} PWR`);
            expect(balance).toBeGreaterThan(BigNumber(1).shiftedBy(8).toNumber());
        },
        {
            timeout: 20000,
        }
    );

    // test('set key transaction', async () => {
    //     try {
    //         const nonce = await falconWallet.getNonce();

    //         if (nonce == 0) {
    //             console.log('set pubkey');
    //             const tx = await falconWallet.setPublicKey(falconWallet.getPublicKey());
    //             console.log(tx);
    //             // console.log('Txn Hash:', tx.transactionHash);
    //             expect(tx.success).toBe(true);
    //         }
    //     } catch (error) {
    //         console.log('Error:', error);
    //         expect(false).toBe(true);
    //     }
    // });

    test(
        'Wallet transfer',
        async () => {
            let to = '0xbc53be623039d659292b80be5b5d1319a44e9d49';

            try {
                const amount = 1n;
                const tx = await falconWallet.transferPWR(to, amount);
                console.log('tx', tx);
                console.log('Txn hash:', tx.hash);
                expect(tx.success).toBe(true);
            } catch (error) {
                console.log('Error:', error);
                expect(false).toBe(true);
            }

            try {
                const tx2 = await wallet0.transferPWR(to, 1n);
                console.log('tx2', tx2);

                expect(tx2.success).toBe(false);
            } catch (error) {
                console.log('Error:', error);
                expect(false).toBe(true);
            }
        },
        {
            timeout: 20000,
        }
    );

    test(
        'vida data txn',
        async () => {
            const data = encoder.encode('PWR Hello for all the listeners!');

            try {
                const tx = await falconWallet.sendPayableVidaData(1n, data, 100n);

                console.log('vida data txn:', tx);
                expect(tx.success).toBe(true);
            } catch (error) {
                expect(false).toBe(true);
            }
        },
        {
            timeout: 10000,
        }
    );

    // test('claim vida id ', async () => {
    //     const vidaId = 456n;

    //     try {
    //         const tx = await falconWallet.claimVidaId(vidaId);
    //         console.log('claim vida id txn:', tx);
    //         // expect(tx.success).toBe(true);
    //         expect(tx.message === 'VIDA ID already claimed');
    //     } catch (error) {
    //         console.log('Error:', error);
    //         expect(false).toBe(true);
    //     }
    // });

    // test('exports a wallet', async () => {
    //     falconWallet.storeWallet('wallet.dat');
    // });

    // test('imports a wallet', async () => {
    //     const path = require('path');
    //     // prettier-ignore
    //     const wallet = await PWRWallet.loadWalletNode(pwr, "wallet.dat");

    //     expect(bytesToHex(falconWallet.getPrivateKey())).toStrictEqual(
    //         bytesToHex(wallet.getPrivateKey())
    //     );
    //     expect(bytesToHex(falconWallet.getPublicKey())).toStrictEqual(
    //         bytesToHex(wallet.getPublicKey())
    //     );
    //     expect(wallet.getAddress()).toStrictEqual(falconWallet.getAddress());
    // });

    // afterAll(() => {
    //     // remove
    //     const _p = path.resolve('wallet.dat');
    //     const exists = fs.existsSync(_p);
    //     if (exists) fs.rmSync(_p);
    // });
    // #endregion
});
