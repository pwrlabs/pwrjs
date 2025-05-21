import { test, expect, BrowserContext, chromium, Page } from '@playwright/test';
import BigNumber from 'bignumber.js';
import { PWRJS } from '@pwrjs/core-beta';

import FalconServiceBrowser from '../../packages/core-browser/src/services/falcon-browser.service';
import PWRFalconl512Wallet from '../../packages/core-browser/src/wallet/falcon-wallet';
// import { TransactionResponse } from '../src/wallet/wallet.types';

type TransactionResponse = {
    success: boolean;
    hash: string;
    error: string;
};

import path from 'path';
import fs from 'fs';

const url = 'http://localhost:5173';

declare global {
    interface Window {
        _pwr: PWRJS;
        svc: typeof FalconServiceBrowser;
        javaSign: {
            message: string;
            pubkey: string;
            signature: string;
        };
        defWallet: {
            pk: string;
            sk: string;
            address: string;
        };
        hexToBytes: (hex: string) => Uint8Array;
        PWRFaconl512Wallet: typeof PWRFalconl512Wallet;
        wallet: PWRFalconl512Wallet;
    }
}

let ctx: BrowserContext;
let page: Page;

// serial
test.describe.configure({
    mode: 'serial',
});

test.beforeAll(async () => {
    ctx = await chromium.launchPersistentContext('', {
        headless: false,
    });

    page = await ctx.newPage();
    await page.goto(url);

    await page.evaluate(() => {
        return new Promise((resolve, reject) => {
            // Set up a timeout to fail if the event doesn't fire within 5 seconds.
            setTimeout(() => {
                reject(new Error('initCompleted timeout'));
            }, 10000);

            // Add an event listener for the custom event.
            window.addEventListener('initCompleted', () => {
                resolve(null);
            });
        });
    });
});

test('generate keypair', async () => {
    const keypair = await page.evaluate(() => {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('initCompleted timeout'));
            }, 20000);

            window.svc.generateKeyPair().then(resolve).catch(reject);
        });
    });

    // keypair should have pk and sk properties

    expect(keypair).not.toBeNull();
    expect(keypair).toHaveProperty('pk');
    expect(keypair).toHaveProperty('sk');
});

// test('sign and verify', async () => {
//     const { signature, valid } = (await page.evaluate((javaSign) => {
//         return new Promise(async (resolve, reject) => {
//             const timeout = setTimeout(() => {
//                 reject(new Error('initCompleted timeout'));
//             }, 20000);

//             const message = new TextEncoder().encode(window.javaSign.message);
//             try {
//                 const keypair = await window.svc.generateKeyPair();

//                 const signature = await window.svc.sign(message, keypair.sk);

//                 const valid = await window.svc.verify(message, keypair.pk, signature);

//                 resolve({ signature, valid });
//             } catch (err) {
//                 reject(err);
//             }
//         });
//     })) as { signature: Uint8Array; valid: boolean };

//     // signature should be a string
//     expect(signature).not.toBeNull();

//     // message should be the same
//     expect(valid).toBe(true);
// });

// test('ensure wallet is restored', async () => {
//     const result = (await page.evaluate(() => {
//         return new Promise((resolve, reject) => {
//             // Set up a timeout to fail if the event doesn't fire within 5 seconds.
//             const timeout = setTimeout(() => {
//                 reject(new Error('initCompleted timeout'));
//             }, 10000);

//             // Add an event listener for the custom event.

//             const address = window.wallet.getAddress();
//             const ogAddress = window.defWallet.address;

//             resolve(ogAddress === address);
//         });
//     })) as boolean;

//     expect(result).toBe(true);
// });

// test('Wallet balance', async () => {
//     const balance = (await page.evaluate(() => {
//         return new Promise(async (resolve, reject) => {
//             const timeout = setTimeout(() => {
//                 reject(new Error('initCompleted timeout'));
//             }, 10000);

//             window.wallet.getBalance().then(resolve).catch(reject);
//         });
//     })) as string;

//     const balanceBN = new BigNumber(balance);
//     console.log(`Balance: ${balanceBN.shiftedBy(-9).toNumber()} PWR`);
//     expect(balance).toBeGreaterThan(BigNumber(5).shiftedBy(9).toNumber());
// });

// test('Wallet transfer', async () => {
//     try {
//         const tx = (await page.evaluate(() => {
//             return new Promise((resolve, reject) => {
//                 const timeout = setTimeout(() => {
//                     reject(new Error('initCompleted timeout'));
//                 }, 10000);

//                 const randomBal = Math.round(Math.random() * 10);
//                 const amount = BigInt(randomBal) * BigInt(10 ** 7); //0.0X PWR

//                 let to = '0x8cc1d696a9a69d6345ad2de0a9d9fadecc6ba767';

//                 window.wallet.transferPWR(to, amount.toString()).then(resolve).catch(reject);
//             });
//         })) as TransactionResponse;

//         console.log('transfer txn:', tx);

//         expect(tx.success).toBe(true);
//     } catch (error) {
//         console.log('transferpwr', error);
//         expect(false).toBe(true);
//     }
// });

// test('export wallet', async () => {
//     try {
//         const downloadPromise = page.waitForEvent('download');

//         await page.evaluate(() => {
//             return new Promise((resolve, reject) => {
//                 const timeout = setTimeout(() => {
//                     reject(new Error('initCompleted timeout'));
//                 }, 10000);

//                 const element = document.createElement('input');
//                 element.id = 'falcon-picker';
//                 element.type = 'file';
//                 element.accept = '.dat';
//                 document.body.appendChild(element);

//                 window.wallet.storeWallet('hellokitty');
//                 resolve(null);
//             });
//         });

//         const download = await downloadPromise;

//         const _p = path.resolve(__dirname, 'wallet.dat');
//         await download.saveAs(_p);
//         expect(fs.existsSync(_p)).toBe(true);

//         // pick the file
//         await page.setInputFiles('#falcon-picker', _p);

//         type waRes = {
//             address: string;
//             pk: Uint8Array;
//             sk: Uint8Array;
//         };

//         const { ogW, newW } = (await page.evaluate(() => {
//             return new Promise((resolve, reject) => {
//                 const timeout = setTimeout(() => {
//                     reject(new Error('initCompleted timeout'));
//                 }, 10000);

//                 const elmnt = document.querySelector('#falcon-picker') as HTMLInputElement;
//                 const file: File = elmnt.files![0];

//                 console.log('file', file);

//                 const pwr = window._pwr;

//                 window.PWRFaconl512Wallet.loadWalletBrowser(pwr, 'hellokitty', file).then((res) => {
//                     console.log('res', res);
//                     resolve({
//                         ogW: {
//                             address: window.wallet.getAddress(),
//                             pk: window.wallet.getPublicKey(),
//                             sk: window.wallet.getPrivateKey(),
//                         },
//                         newW: {
//                             address: res.getAddress(),
//                             pk: res.getPublicKey(),
//                             sk: res.getPrivateKey(),
//                         },
//                     });
//                 });
//             });
//         })) as { ogW: waRes; newW: waRes };

//         expect(ogW).toBeDefined();
//         expect(newW).toBeDefined();
//         expect(ogW.address).toBe(newW.address);
//         expect(typeof ogW.pk).toBe(typeof newW.pk);
//         expect(newW.pk.length).toBe(ogW.pk.length);
//         expect(newW.pk).toStrictEqual(ogW.pk);
//         expect(typeof ogW.sk).toBe(typeof newW.sk);
//         expect(newW.sk.length).toBe(ogW.sk.length);
//         expect(newW.sk).toStrictEqual(ogW.sk);

//         // expect(newW.getAddress()).toBe(ogW.getAddress());
//     } catch (error) {
//         console.log('transferpwr', error);
//         expect(false).toBe(true);
//     }
// });

test.afterAll(async () => {
    const _p = path.resolve(__dirname, 'wallet.dat');
    const exists = fs.existsSync(_p);
    if (exists) fs.rmSync(_p);
});
