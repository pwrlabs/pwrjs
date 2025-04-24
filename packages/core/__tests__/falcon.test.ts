import { describe, test, expect, afterAll } from 'vitest';

import BigNumber from 'bignumber.js';
import Falcon512Wallet from '../src/wallet/falcon-512-wallet';
import { PWRJS } from '../src';
import FalconServiceNode from '../src/services/falcon/falcon-node.service';
import { hexToBytes, bytesToHex } from '@noble/hashes/utils';

import JFalconServiceNode from '../src/services/falcon-legacy/falcon-node.service';

import { Falcon } from '../src/services/falcon.service';

// import Falcon from './falcon';

const path = require('path') as typeof import('path');
const fs = require('fs') as typeof import('fs');

const RPC = 'http://46.101.151.203:8085';

// http://104.248.38.152:8085/giveTokensToValidatorNode/?validatorAddress=0x7D55953FF7572C32AF4EC31D2AD6E8E70F61F874

// async function generateWallet() {
//     const pwr = new PWRJS(RPC);
//     const falconWallet = await Falcon512Wallet.new(pwr);

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
    const falconWallet = Falcon512Wallet.fromKeys(pwr, w.pk, w.sk);
    let wallet0: Falcon512Wallet;

    const encoder = new TextEncoder();

    // test('init wallet', async () => {
    //     wallet0 = await Falcon512Wallet.new(pwr);

    //     const address = falconWallet.getAddress();
    //     expect(address).toMatch(/[0-9A-Fa-f]{40}/g);

    //     const pubkey = falconWallet.getPublicKey();
    //     expect(pubkey).toBeInstanceOf(Uint8Array);

    //     console.log({ wallet: address });
    // });

    // test('ensure wallet is restored', async () => {
    //     const address = falconWallet.getAddress();
    //     expect(address).toBe(ogAddress);
    // });

    // test('sign', async () => {
    //     const data = new TextEncoder().encode('hello world');
    //     const signature = await falconWallet.sign(data);

    //     const valid = await FalconServiceNode.verify(data, falconWallet.getPublicKey(), signature);
    //     const valid2 = await falconWallet.verifySignature(data, signature);

    //     expect(signature).toBeInstanceOf(Uint8Array);
    //     expect(valid).toBe(true);
    //     expect(valid2).toBe(true);
    // });

    // test('Wallet balance', async () => {
    //     const balance = await pwr.getBalanceOfAddress(falconWallet.getAddress());

    //     const balanceBN = new BigNumber(balance.toString());

    //     console.log(`Balance: ${balanceBN.shiftedBy(-9).toNumber()} PWR`);
    //     expect(balance).toBeGreaterThan(BigNumber(1).shiftedBy(9).toNumber());
    // });

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

    // test('Wallet transfer', async () => {
    //     let to = '0x8cc1d696a9a69d6345ad2de0a9d9fadecc6ba767';

    //     try {
    //         const amount = '100';
    //         const tx = await falconWallet.transferPWR(to, amount.toString());
    //         console.log('tx', tx);
    //         console.log('Txn hash:', tx.transactionHash);
    //         expect(tx.success).toBe(true);
    //     } catch (error) {
    //         expect(false).toBe(true);
    //     }

    //     // try {
    //     //     const tx2 = await wallet0.transferPWR(to, '1');

    //     //     expect(tx2.success).toBe(false);
    //     // } catch (error) {
    //     //     expect(false).toBe(true);
    //     // }
    // });

    // test('delete', async () => {
    //     const keypair = await JFalconServiceNode.generateKeyPair();

    //     const string = 'hello world';
    //     const message = new TextEncoder().encode(string);

    //     const signature = await JFalconServiceNode.sign(message, keypair.pk, keypair.sk);
    //     const valid = await JFalconServiceNode.verify(message, keypair.pk, signature);

    //     // expect(signature).toBeInstanceOf(Uint8Array);
    //     expect(valid).toBe(true);

    //     // const signature = await falconWallet.sign(message);

    //     const m = 'message=' + string;
    //     const s = 'signature=' + signature;
    //     const pk = 'publicKey=' + keypair.pk.H;
    //     const res = await fetch(pwr.getRpcNodeUrl() + `/signatureVerification?${m}&${s}&${pk}`, {
    //         method: 'GET',
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //     });

    //     const data = await res.json();

    //     console.log(data);
    // });

    test('test delete later', async () => {
        const message = 'hello world';
        const messageBytes = new TextEncoder().encode(message);

        const messageHex = bytesToHex(messageBytes);

        const keypair512 = await FalconServiceNode.generateKeyPair();
        const keypair1024 = await FalconServiceNode.generateKeyPair1024();

        const fs_keypair512 = await Falcon.generateKeypair512();
        const fs_keypair1024 = await Falcon.generateKeypair1024();

        // dashlane 512
        const dl_signature_512 = await FalconServiceNode.sign(messageBytes, keypair512.sk);
        const dl_valid_512 = await FalconServiceNode.verify(
            messageBytes,
            keypair512.pk,
            dl_signature_512
        );

        // dashlane 1024
        const dl_signature_1024 = await FalconServiceNode.sign1024(messageBytes, keypair1024.sk);
        const dl_valid_1024 = await FalconServiceNode.verify1024(
            messageBytes,
            keypair1024.pk,
            dl_signature_1024
        );

        // falcon-sign 512
        // const fs_signature_512 = await Falcon.sign512(messageBytes, fs_keypair512.sk);
        // const fs_valid_512 = await Falcon.verify512(
        //     messageBytes,
        //     fs_keypair512.pk,
        //     fs_signature_512
        // );

        // // falcon-sign 1024
        // const fs_signature_1024 = await Falcon.sign1024(messageBytes, fs_keypair1024.sk);
        // const fs_valid_1024 = await Falcon.verify1024(
        //     messageBytes,
        //     fs_keypair1024.pk,
        //     fs_signature_1024
        // );

        expect(dl_valid_512).toBe(true);
        expect(dl_valid_1024).toBe(true);
        // expect(fs_valid_512).toBe(true);
        // expect(fs_valid_1024).toBe(true);

        console.log({
            messageHex: messageHex,
            lib_1: {
                512: {
                    pk: keypair512.pk,
                    signature: dl_signature_512,
                    valid: dl_valid_512,
                },
                1024: {
                    pk: keypair1024.pk,
                    signature: dl_signature_1024,
                    valid: dl_valid_1024,
                },
            },
            // lib_2: {
            //     512: {
            //         pk: keypair512.pk,
            //         signature: fs_signature_512,
            //         valid: fs_valid_512,
            //     },
            //     1024: {
            //         pk: keypair1024.pk,
            //         signature: fs_signature_1024,
            //         valid: fs_valid_1024,
            //     },
            // },
        });
    });

    // test('claim vida id txn', async () => {
    //     let vidaId = BigInt(1);

    //     try {
    //         const amount = '100';
    //         const tx = await falconWallet;
    //         console.log('tx', tx);
    //         console.log('Txn hash:', tx.transactionHash);
    //         expect(tx.success).toBe(true);
    //     } catch (error) {
    //         expect(false).toBe(true);
    //     }

    //     // try {
    //     //     const tx2 = await wallet0.transferPWR(to, '1');

    //     //     expect(tx2.success).toBe(false);
    //     // } catch (error) {
    //     //     expect(false).toBe(true);
    //     // }
    // });

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

    // test('exports a wallet', async () => {
    //     falconWallet.storeWallet('wallet.dat');
    // });

    // test('imports a wallet', async () => {
    //     const path = require('path');
    //     // prettier-ignore
    //     const wallet = await Falcon512Wallet.loadWalletNode("wallet.dat");

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
