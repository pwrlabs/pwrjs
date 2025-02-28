import PWRWallet from '../src/wallet/wallet';
import { keccak256 } from 'js-sha3';

import axios from 'axios';
import BigNumber from 'bignumber.js';
import TransactionBuilder from '../src/protocol/transaction-builder';
import { bytesToHex, decodeHex, signTxn } from '../src/utils';
import PWRFaconl512Wallet from '../src/wallet/falcon-512-wallet';
import { PWRJS } from '../src';

const path = require('path') as typeof import('path');
const fs = require('fs') as typeof import('fs');

const RPC = 'https://pwrrpc.pwrlabs.io';

async function generateWallet() {
    const pwr = new PWRJS(RPC);
    const falconWallet = new PWRFaconl512Wallet(pwr);
    await falconWallet.init();
    const seed = Buffer.from(falconWallet.getSeed()).toString('hex');
    const address = falconWallet.getAddress();
    const content = JSON.stringify({ seed, address });
    const filePath = path.resolve(__dirname, 'files', 'seed.json');
    fs.writeFileSync(filePath, content);
}

function restoreWallet(): { seed: Buffer; address: string } {
    const filePath = path.resolve(__dirname, 'files', 'seed.json');
    const content = fs.readFileSync(filePath, 'utf-8');
    const { seed, address } = JSON.parse(content);
    const seedBuffer = Buffer.from(seed, 'hex');
    return {
        seed: seedBuffer,
        address,
    };
}

type Config = {
    restore_wallet: boolean;
};

describe('wallet core', () => {
    const configfile = path.resolve(__dirname, 'files', 'config.json');
    const config = JSON.parse(fs.readFileSync(configfile, 'utf-8')) as Config;

    let seed = null;
    let ogAddress = null;

    if (config.restore_wallet) {
        const c = restoreWallet();
        seed = c.seed;
        ogAddress = c.address;
    }

    const pwr = new PWRJS('https://pwrrpc.pwrlabs.io');
    const falconWallet = new PWRFaconl512Wallet(pwr, seed);

    const wallet0 = new PWRFaconl512Wallet(pwr, seed);

    test('init wallet', async () => {
        await falconWallet.init();
        await wallet0.init();

        const address = falconWallet.getAddress();
        expect(address).toMatch(/[0-9A-Fa-f]{40}/g);

        const pubkey = falconWallet.getPublicKey();
        expect(pubkey).toBeInstanceOf(Uint8Array);
    });

    test('ensure wallet is restored', async () => {
        const address = falconWallet.getAddress();
        expect(address).toBe(ogAddress);
    });

    test('sign ', async () => {
        const data = new TextEncoder().encode('hello world');

        const signature = falconWallet.sign(data);

        expect(signature).toBeInstanceOf(Uint8Array);
    });

    it('Wallet balance', async () => {
        const balance = await pwr.getBalanceOfAddress(
            falconWallet.getAddress()
        );

        const balanceBN = new BigNumber(balance);

        console.log(`Balance: ${balanceBN.shiftedBy(-9).toNumber()} PWR`);

        expect(balance).toBeGreaterThan(BigNumber(900).shiftedBy(9).toNumber());
    });

    test('set key transaction', async () => {
        const randomBal = Math.round(Math.random() * 10);
        // console.log('randomBal', randomBal);

        try {
            const amount = BigInt(randomBal) * BigInt(10 ** 8);
            const tx = await falconWallet.setPublicKey(null);

            console.log('set pubkey txn:', tx);

            // expect(tx.success).toBe(true);
        } catch (error) {
            console.log('error', error);
            expect(false).toBe(true);
        }
    });

    it('Wallet transfer', async () => {
        const randomBal = Math.round(Math.random() * 10);
        // console.log('randomBal', randomBal);

        let destinyAddress = '0x8cc1d696a9a69d6345ad2de0a9d9fadecc6ba767';

        const to = Buffer.from(destinyAddress.slice(2), 'hex');

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

    // it('Wallet address and public and private key', () => {
    //     const address = pwrWallet.getAddress();
    //     const privateKey = pwrWallet.getPrivateKey();
    //     const publicKey = pwrWallet.getPublicKey();

    //     const testAddress = /[0-9A-Fa-f]{40}/g;
    //     const testPvk = /[0-9A-Fa-f]{64}/g;
    //     const testPbk = /[0-9A-Fa-f]{128}/g;

    //     expect(testAddress.test(address)).toBe(true);
    //     expect(testPvk.test(privateKey)).toBe(true);

    //     expect(testPbk.test(publicKey)).toBe(true);
    // });

    // const wallet0 = new PWRWallet();

    // const pvkGuardian =
    //     '0xb8a70832e8fec8f6a0ec4721f5d5b0239834105eb52a606914e61fbe3506d278';
    // const guardianWallet = new PWRWallet(pvkGuardian);

    // const validator = '0x87B84E7FAF722FB906F34E4EB9118F49933E55FA';
    // const validator2 = '0x3ca41ed6a4bf1e838b6b2126a3be77fd07d9f344';

    // const chainId = 0;
    // pwrWallet.setChainId(chainId);

    // const guardianAddress = '0x8cc1d696a9a69d6345ad2de0a9d9fadecc6ba767';

    // console.log('validatorAddress', validator);
    // console.log('wallet', pwrWallet.getAddress());
    // console.log('pvk', pwrWallet.getPrivateKey());

    // // #region wallet props

    // it('Wallet nonce', async () => {
    //     const _nonce = await pwrWallet.getNonce();
    //     expect(_nonce).toBeGreaterThanOrEqual(0);
    // });
});
