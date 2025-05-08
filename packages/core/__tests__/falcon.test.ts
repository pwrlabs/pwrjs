import { describe, test, expect, afterAll } from 'vitest';

import BigNumber from 'bignumber.js';
import Falcon512Wallet from '../src/wallet/falcon-512-wallet';
import { PWRJS } from '../src';
import FalconServiceNode from '../src/services/falcon/falcon-node.service';
import { hexToBytes, bytesToHex } from '@noble/hashes/utils';

import DeterministicSecureRandom from '../src/services/secure-random.service';

import * as bip39 from 'bip39';
// import { falconKeypair } from 'rust-falcon';

const path = require('path') as typeof import('path');
const fs = require('fs') as typeof import('fs');

// const RPC = 'http://46.101.151.203:8085';
const RPC = 'https://pwrrpc.pwrlabs.io';

// http://104.248.38.152:8085/giveTokensToValidatorNode/?validatorAddress=0x7D55953FF7572C32AF4EC31D2AD6E8E70F61F874

// async function generateWallet() {
//     // const mnemonic = bip39.generateMnemonic();
//     const mnemonic =
//         'demand april length soap cash concert shuffle result force mention fringe slim';
//     const seed = bip39.mnemonicToSeedSync(mnemonic, '');
//     const randomBytes = new DeterministicSecureRandom(seed).nextBytes(48);
//     const keypair = falconKeypair(randomBytes);

//     const pwr = new PWRJS(RPC);
//     const falconWallet = await Falcon512Wallet.fromKeys(keypair.secret, keypair.public, pwr);

//     const pk = falconWallet.getPublicKey();
//     const sk = falconWallet.getPrivateKey();
//     const address = falconWallet.getAddress();

//     const pkHex = Buffer.from(pk).toString('hex');
//     const skHex = Buffer.from(sk).toString('hex');

//     const content = JSON.stringify({ pk: pkHex, sk: skHex, address, mnemonic });
//     const filePath = path.resolve(__dirname, 'files', 'seed.json');
//     fs.writeFileSync(filePath, content);

//     const expected_address = '0xe68191b7913e72e6f1759531fbfaa089ff02308a';
//     const expected_seed =
//         '2246A57C783F18B07268FCF675486C3A45826C48F703062179EED5BBDF2BEE7A622EDDFEF7EDA803EC18E882CC8209893450DE472EE6049EE8C740327CA5F052';
//     const expected_random_bytes =
//         'EF91172C58D19AE4D465C58FED214A99D60A5BED95C7919B849132D787192FF58D19D2DA2A8F83F28BECFDF603BC5F35';

//     if (expected_seed !== bytesToHex(seed).toUpperCase()) {
//         throw new Error('Seed does not match the expected seed');
//     }
//     if (expected_random_bytes !== bytesToHex(randomBytes).toUpperCase()) {
//         throw new Error('Random bytes do not match the expected random bytes');
//     }
//     if (expected_address !== address) {
//         throw new Error('Address does not match the expected address');
//     }
// }

// generateWallet()
//     .then(() => {
//         // end process
//         process.exit();
//     })
//     .catch((err) => {
//         console.error(err);
//         // end process
//         process.exit();
//     });

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
    const w = restoreWallet();
    const ogAddress = w.address;

    const pwr = new PWRJS(RPC);
    const falconWallet = await Falcon512Wallet.fromKeys(w.sk, w.pk, pwr);
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

        const valid = await FalconServiceNode.verify(data, falconWallet.getPublicKey(), signature);
        const valid2 = await falconWallet.verifySignature(data, signature);

        console.log({ valid, valid2 });

        expect(signature).toBeInstanceOf(Uint8Array);
        expect(valid).toBe(true);
        expect(valid2).toBe(true);
    });

    test('Wallet balance', async () => {
        const balance = await pwr.getBalanceOfAddress(falconWallet.getAddress());

        const balanceBN = new BigNumber(balance.toString());

        console.log(`Balance: ${balanceBN.shiftedBy(-9).toNumber()} PWR`);
        expect(balance).toBeGreaterThan(BigNumber(1).shiftedBy(9).toNumber());
    });

    test('set key transaction', async () => {
        try {
            const nonce = await falconWallet.getNonce();

            if (nonce == 0) {
                console.log('set pubkey');
                const tx = await falconWallet.setPublicKey(falconWallet.getPublicKey());
                console.log(tx);
                // console.log('Txn Hash:', tx.transactionHash);
                expect(tx.success).toBe(true);
            }
        } catch (error) {
            console.log('Error:', error);
            expect(false).toBe(true);
        }
    });

    test('Wallet transfer', async () => {
        let to = '0x8cc1d696a9a69d6345ad2de0a9d9fadecc6ba767';

        try {
            const amount = 1200000000n;
            const tx = await falconWallet.transferPWR(to, amount);
            console.log('tx', tx);
            console.log('Txn hash:', tx.transactionHash);
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
    });

    test('vida data txn', async () => {
        const data = encoder.encode('PWR Hello for all the listeners!');

        try {
            const tx = await falconWallet.submitPayableVidaData(1n, data, 100n);

            console.log('vida data txn:', tx);
            expect(tx.success).toBe(true);
        } catch (error) {
            expect(false).toBe(true);
        }
    });

    test('claim vida id ', async () => {
        const vidaId = 456n;

        try {
            const tx = await falconWallet.claimVidaId(vidaId);
            console.log('claim vida id txn:', tx);
            // expect(tx.success).toBe(true);
            expect(tx.message === 'VIDA ID already claimed');
        } catch (error) {
            console.log('Error:', error);
            expect(false).toBe(true);
        }
    });

    test('exports a wallet', async () => {
        falconWallet.storeWallet('wallet.dat');
    });

    test('imports a wallet', async () => {
        const path = require('path');
        // prettier-ignore
        const wallet = await Falcon512Wallet.loadWalletNode(pwr, "wallet.dat");

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
