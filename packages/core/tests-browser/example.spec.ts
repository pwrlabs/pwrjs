import { test, expect, BrowserContext, chromium, Page } from '@playwright/test';

import FalconService from '../../core/src/services/falcon/falcon-browser.service';

const url = 'http://localhost:5173';

declare global {
    interface Window {
        svc: FalconService;
        javaSign: {
            message: string;
            pubkey: string;
            signature: string;
        };
    }
}

let ctx: BrowserContext;
let page: Page;

// serial
test.describe.configure({
    mode: 'serial',
});

test.beforeAll(async () => {
    ctx = await chromium.launchPersistentContext('', {});

    page = await ctx.newPage();
    await page.goto(url);

    await page.evaluate(() => {
        return new Promise((resolve, reject) => {
            // Set up a timeout to fail if the event doesn't fire within 5 seconds.
            const timeout = setTimeout(() => {
                reject(new Error('initCompleted timeout'));
            }, 40000);

            // Add an event listener for the custom event.
            window.addEventListener('initCompleted', () => {
                clearTimeout(timeout);
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

            window.svc
                .generateKeyPair()
                .then((keypair) => {
                    resolve(keypair);
                })
                .catch((err) => {
                    reject(err);
                });
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

                const signature = await window.svc.sign(
                    message,
                    keypair.pk,
                    keypair.sk
                );

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
    })) as { signature: string; valid: boolean };

    // signature should be a string
    expect(signature).not.toBeNull();

    // message should be the same
    expect(valid).toBe(true);
});

test('verify remote signature', async () => {
    const { valid } = (await page.evaluate((javaSign) => {
        return new Promise(async (resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('initCompleted timeout'));
            }, 20000);

            const { message, pubkey, signature } = window.javaSign;
            try {
                const valid = await window.svc.verify(
                    new TextEncoder().encode(message),
                    { H: pubkey },
                    signature
                );

                resolve({ valid });
            } catch (err) {
                reject(err);
            }
        });
    })) as { valid: boolean };

    // signature should be a string
    expect(valid).toBe(true);
});
