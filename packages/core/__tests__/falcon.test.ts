import { describe, test, expect } from 'vitest';

import BigNumber from 'bignumber.js';
import PWRFaconl512Wallet from '../src/wallet/falcon-512-wallet';
import { PWRJS } from '../src';
import FalconServiceNode from '../src/services/falcon/falcon-node.service';

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
        pk: Buffer.from(pk, 'hex'),
        sk: Buffer.from(sk, 'hex'),
        address,
    };
}

type Config = {
    restore_wallet: boolean;
};

describe('wallet core', () => {
    const w = restoreWallet();
    const ogAddress = w.address;

    const pwr = new PWRJS(RPC);
    const falconWallet = PWRFaconl512Wallet.fromKeys(pwr, w.pk, w.sk);
    let wallet0: PWRFaconl512Wallet;

    const encoder = new TextEncoder();

    test('init wallet', async () => {
        wallet0 = await PWRFaconl512Wallet.new(pwr);

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

        const valid = await FalconServiceNode.verify(
            data,
            falconWallet.getPublicKey(),
            signature
        );

        expect(signature).toBeInstanceOf(Uint8Array);
        expect(valid).toBe(true);
    });

    test('Wallet balance', async () => {
        const balance = await pwr.getBalanceOfAddress(
            falconWallet.getAddress()
        );

        const balanceBN = new BigNumber(balance);

        console.log(`Balance: ${balanceBN.shiftedBy(-9).toNumber()} PWR`);
        expect(balance).toBeGreaterThan(BigNumber(5).shiftedBy(9).toNumber());
    });

    // test('set key transaction', async () => {
    //     const randomBal = Math.round(Math.random() * 10);
    //     // console.log('randomBal', randomBal);

    //     try {
    //         const amount = BigInt(randomBal) * BigInt(10 ** 8);
    //         const tx = await falconWallet.setPublicKey(null);

    //         console.log('set pubkey txn:', tx);

    //         // expect(tx.success).toBe(true);
    //     } catch (error) {
    //         console.log('error', error);
    //         expect(false).toBe(true);
    //     }
    // });

    test('Wallet transfer', async () => {
        const randomBal = Math.round(Math.random() * 10);
        // console.log('randomBal', randomBal);

        let to = '0x8cc1d696a9a69d6345ad2de0a9d9fadecc6ba767';

        try {
            const amount = BigInt(randomBal) * BigInt(10 ** 8);
            const tx = await falconWallet.transferPWR(to, amount.toString());

            console.log('transfer txn:', tx);

            expect(tx.success).toBe(true);
        } catch (error) {
            console.log('transferpwr', error);
            expect(false).toBe(true);
        }

        try {
            const tx2 = await wallet0.transferPWR(to, '1');

            expect(tx2.success).toBe(false);
        } catch (error) {
            console.log('error transfer txn', error);
            expect(false).toBe(true);
        }
    });

    test('Vm Data transaction', async () => {
        const data = encoder.encode('PWR Hello for all the listeners!');

        try {
            const tx = await falconWallet.sendVmData('1', data);

            console.log('vm data txn:', tx);

            expect(tx.success).toBe(true);
        } catch (error) {
            console.log('error vm data txn', error);
            expect(false).toBe(true);
        }
    });
});
