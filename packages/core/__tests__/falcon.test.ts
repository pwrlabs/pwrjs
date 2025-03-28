import { describe, test, expect, afterAll } from 'vitest';

import BigNumber from 'bignumber.js';
import Falcon512Wallet from '../src/wallet/falcon-512-wallet';
import { PWRJS } from '../src';
import { Falcon } from '../src/services/falcon.service';
import { hexToBytes, bytesToHex } from '@noble/hashes/utils';

const path = require('path') as typeof import('path');
const fs = require('fs') as typeof import('fs');

const RPC = 'https://pwrrpc.pwrlabs.io';

// async function generateWallet() {
//     const pwr = new PWRJS(RPC);
//     const falconWallet = await PWRFaconl512Wallet.new(pwr);

//     const pk = falconWallet.getPublicKey();
//     const sk = falconWallet.getPrivateKey();
//     const address = falconWallet.getAddress();

//     const pkHex = Buffer.from(pk).toString('hex');
//     const skHex = Buffer.from(sk).toString('hex');

//     const content = JSON.stringify({ pk: pkHex, sk: skHex, address });
//     const filePath = path.resolve(__dirname, 'files', 'seed.json');
//     fs.writeFileSync(filePath, content);
// }

// generateWallet().then(() => {
//     // end process
//     exit(0);
// });

function restoreWallet(): { pk: Uint8Array; address: string; sk: Uint8Array } {
    const filePath = path.resolve(__dirname, 'files', 'seed.json');
    const content = fs.readFileSync(filePath, 'utf-8');
    const { pk, sk, address } = JSON.parse(content) as {
        pk: string;
        sk: string;
        address: string;
    };

    return {
        pk: Uint8Array.from(hexToBytes(pk)),
        sk: Uint8Array.from(hexToBytes(sk)),
        address,
    };
}

describe('wallet core', () => {
    const w = restoreWallet();
    const ogAddress = w.address;

    const pwr = new PWRJS(RPC);
    const falconWallet = Falcon512Wallet.fromKeys(w.pk, w.sk);
    let wallet0: Falcon512Wallet;

    const encoder = new TextEncoder();

    test('init wallet', async () => {
        wallet0 = await Falcon512Wallet.new(pwr);

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

        const valid = await Falcon.verify512(
            data,
            signature,
            falconWallet.getPublicKey()
        );
        
        const valid2 = await falconWallet.verifySignature(data, signature);

        expect(signature).toBeInstanceOf(Uint8Array);
        expect(valid).toBe(true);
        expect(valid2).toBe(true);
    });

    test('Wallet balance', async () => {
        const balance = await pwr.getBalanceOfAddress(
            falconWallet.getAddress()
        );

        const balanceBN = new BigNumber(balance);

        console.log(`Balance: ${balanceBN.shiftedBy(-9).toNumber()} PWR`);
        expect(balance).toBeGreaterThan(BigNumber(1).shiftedBy(9).toNumber());
    });

    test('set key transaction', async () => {
        try {
            const nonce = await falconWallet.getNonce();

            if (nonce == 0) {
                const tx = await falconWallet.setPublicKey(falconWallet.getPublicKey());

                console.log('Txn Hash:', tx.transactionHash);
                expect(tx.success).toBe(true);
            }
        } catch (error) {
            expect(false).toBe(true);
        }
    });

    test('Wallet transfer', async () => {
        let to = '0x8cc1d696a9a69d6345ad2de0a9d9fadecc6ba767';

        try {
            const amount = '100';
            const tx = await falconWallet.transferPWR(to, amount.toString());
            console.log('Txn hash:', tx.transactionHash);
            expect(tx.success).toBe(true);
        } catch (error ) {
            expect(false).toBe(true);
        }

        try {
            const tx2 = await wallet0.transferPWR(to, '1');

            expect(tx2.success).toBe(false);
        } catch (error) {
            expect(false).toBe(true);
        }
    });

    // test('Vm Data transaction', async () => {
    //     const data = encoder.encode('PWR Hello for all the listeners!');

    //     try {
    //         const tx = await falconWallet.sendVmData('1', data);

    //         console.log('Txn hash:', tx);

    //         expect(tx.success).toBe(true);
    //     } catch (error) {
    //         expect(false).toBe(true);
    //     }
    // });

    test('exports a wallet', async () => {
        falconWallet.storeWallet("wallet.dat");
    });

    test('imports a wallet', async () => {
        const path = require('path');
        // prettier-ignore
        const wallet = await Falcon512Wallet.loadWalletNode("wallet.dat");

        expect(bytesToHex(falconWallet.getPrivateKey())).toStrictEqual(
            bytesToHex(wallet.getPrivateKey())
        );
        expect(bytesToHex(falconWallet.getPublicKey())).toStrictEqual(
            bytesToHex(wallet.getPublicKey())
        );
        expect(wallet.getAddress()).toStrictEqual(falconWallet.getAddress());
    });

    afterAll(() => {
        // remove
        const _p = path.resolve('wallet.dat');
        const exists = fs.existsSync(_p);
        if (exists) fs.rmSync(_p);
    }); 
    // #endregion
});
