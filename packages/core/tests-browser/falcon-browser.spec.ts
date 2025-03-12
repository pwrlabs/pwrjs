import { test, expect, BrowserContext, chromium, Page } from '@playwright/test';

import FalconServiceBrowser from '../src/services/falcon/falcon-browser.service';
import PWRFaconl512Wallet from '../src/wallet/falcon-512-wallet';
import PWRJS from '../src/protocol/pwrjs';
import { HexToBytes } from '../src/utils';
import BigNumber from 'bignumber.js';
import { TransactionResponse } from '../src/wallet/wallet.types';

const url = 'http://localhost:5173';

declare global {
    interface Window {
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
        PWRFaconl512Wallet: typeof PWRFaconl512Wallet;
        wallet: PWRFaconl512Wallet;
    }
}

let ctx: BrowserContext;
let page: Page;

// serial
test.describe.configure({
    mode: 'serial',
});

let wallet: PWRFaconl512Wallet;
let pwr: PWRJS;
let defWallet: { pk: string; sk: string; address: string };

test.beforeAll(async () => {
    ctx = await chromium.launchPersistentContext('', {
        headless: true,
    });

    page = await ctx.newPage();
    await page.goto(url);

    (await page.evaluate(() => {
        return new Promise((resolve, reject) => {
            // Set up a timeout to fail if the event doesn't fire within 5 seconds.
            const timeout = setTimeout(() => {
                reject(new Error('initCompleted timeout'));
            }, 10000);

            // Add an event listener for the custom event.
            window.addEventListener('initCompleted', () => {
                clearTimeout(timeout);
                resolve(window.defWallet);
            });
        });
    })) as { pk: string; sk: string; address: string };
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

test('sign and verify', async () => {
    const { signature, valid } = (await page.evaluate((javaSign) => {
        return new Promise(async (resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('initCompleted timeout'));
            }, 20000);

            const message = new TextEncoder().encode(window.javaSign.message);
            try {
                const keypair = await window.svc.generateKeyPair();

                const signature = await window.svc.sign(message, keypair.sk);

                const valid = await window.svc.verify(
                    message,
                    keypair.pk,
                    signature
                );

                resolve({ signature, valid });
            } catch (err) {
                reject(err);
            }
        });
    })) as { signature: Uint8Array; valid: boolean };

    // signature should be a string
    expect(signature).not.toBeNull();

    // message should be the same
    expect(valid).toBe(true);
});

// test('verify remote signature', async () => {
//     const { valid } = (await page.evaluate((javaSign) => {
//         return new Promise(async (resolve, reject) => {
//             const timeout = setTimeout(() => {
//                 reject(new Error('initCompleted timeout'));
//             }, 5000);

//             const { message, pubkey, signature } = window.javaSign;

//             const pk = window.hexToBytes(pubkey);
//             const _signature = window.hexToBytes(signature);

//             try {
//                 const valid = await window.svc.verify(
//                     new TextEncoder().encode(message),
//                     pk,
//                     _signature
//                 );

//                 resolve({ valid });
//             } catch (err) {
//                 reject(err);
//             }
//         });
//     })) as { valid: boolean };

//     // signature should be a string
//     expect(valid).toBe(true);
// });

test('ensure wallet is restored', async () => {
    const result = (await page.evaluate(() => {
        return new Promise((resolve, reject) => {
            // Set up a timeout to fail if the event doesn't fire within 5 seconds.
            const timeout = setTimeout(() => {
                reject(new Error('initCompleted timeout'));
            }, 10000);

            // Add an event listener for the custom event.

            const address = window.wallet.getAddress();
            const ogAddress = window.defWallet.address;

            resolve(ogAddress === address);
        });
    })) as boolean;

    expect(result).toBe(true);
});

test('Wallet balance', async () => {
    const balance = (await page.evaluate(() => {
        return new Promise(async (resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('initCompleted timeout'));
            }, 10000);

            window.wallet.getBalance().then(resolve).catch(reject);
        });
    })) as string;

    const balanceBN = new BigNumber(balance);
    console.log(`Balance: ${balanceBN.shiftedBy(-9).toNumber()} PWR`);
    expect(balance).toBeGreaterThan(BigNumber(5).shiftedBy(9).toNumber());
});

// test('set key transaction', async () => {
//     const randomBal = Math.round(Math.random() * 10);
//     // console.log('randomBal', randomBal);

//     try {
//         const tx = (await page.evaluate(() => {
//             return new Promise((resolve, reject) => {
//                 const timeout = setTimeout(() => {
//                     reject(new Error('initCompleted timeout'));
//                 }, 10000);

//                 window.wallet.setPublicKey().then(resolve).catch(reject);
//             });
//         })) as TransactionResponse;

//         console.log('set pubkey txn:', tx);

//         expect(tx.success).toBe(true);
//     } catch (error) {
//         console.log('error', error);
//         expect(false).toBe(true);
//     }
// });

test('Wallet transfer', async () => {
    try {
        const tx = (await page.evaluate(() => {
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('initCompleted timeout'));
                }, 10000);

                const randomBal = Math.round(Math.random() * 10);
                const amount = BigInt(randomBal) * BigInt(10 ** 8);

                let destinyAddress =
                    '0x8cc1d696a9a69d6345ad2de0a9d9fadecc6ba767';

                const to = window.hexToBytes(destinyAddress.slice(2));

                window.wallet
                    .transferPWR(to, amount.toString())
                    .then(resolve)
                    .catch(reject);
            });
        })) as TransactionResponse;

        console.log('transfer txn:', tx);

        expect(tx.success).toBe(true);
    } catch (error) {
        console.log('transferpwr', error);
        expect(false).toBe(true);
    }
});
