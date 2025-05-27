# PWRJS

PWRJS is a JavaScript library for interacting with the PWR blobkchain. It provides an interface for wallet management and sending transactions on PWR.

<div align="center">
<!-- markdownlint-restore -->

[![Pull Requests welcome](https://img.shields.io/badge/PRs-welcome-ff69b4.svg?style=flat-square)](https://github.com/pwrlabs/pwrjs/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22)
<a href="https://www.npmjs.com/package/@pwrjs/core">
<img src='https://img.shields.io/npm/v/@pwrjs/core' />
</a>
<a href="https://www.npmjs.com/package/@pwrjs/core">
<img src='https://img.shields.io/npm/dt/@pwrjs/core?color=blueviolet' />
</a>
<a href="https://github.com/pwrlabs/pwrjs/blob/main/LICENSE/">
<img src="https://img.shields.io/badge/license-MIT-black">
</a>

<!-- <a href="https://github.com/pwrlabs/pwrjs/stargazers">
  <img src='https://img.shields.io/github/stars/pwrlabs/pwrjs?color=yellow' />
</a> -->
<a href="https://pwrlabs.io/">
  <img src="https://img.shields.io/badge/powered_by-PWR Chain-navy">
</a>
<a href="https://www.youtube.com/@pwrlabs">
  <img src="https://img.shields.io/badge/Community%20calls-Youtube-red?logo=youtube"/>
</a>
<a href="https://twitter.com/pwrlabs">
  <img src="https://img.shields.io/twitter/follow/pwrlabs?style=social"/>
</a>

</div>

## Installation

install the package according to your environment. (nodejs or browser)

```sh
# latest official release (main branch)
$ npm install @pwrjs/browser
#or
$ npm install @pwrjs/node

# for latest pre-release version (develop branch)
$ npm install @pwrjs/browsere@next
# or
$ npm install @pwrjs/node@next

# for latest beta release version (beta branch)
$ npm install @pwrjs/browser@beta
# or
$ npm install @pwrjs/node@beta
```

## 🌐 Documentation

How to [Guides](https://pwrlabs.io) 🔜 & [API](https://pwrlabs.io) 💻

Play with [Code Examples](https://github.com/keep-pwr-strong/pwr-examples/) 🎮

## 💫 Getting Started

**Import the library:**

```ts
import PWRJS from '@pwrjs/node';
import PWRWallet from '@pwrjs/node/wallet';

// or
const PWRJS = require('@pwrjs/node');
const PWRWallet = require('@pwrjs/node/wallet');
```

**Create a new instance**

```ts
const pwrjs = new PWRJS('https://pwrrpc.pwrlabs.io');
```

**Generate a new wallet:**

```ts
const wallet = await PWRWallet.new();
```

**Import an existing wallet:**

```ts
const pwr = new PWRJS('https://pwrrpc.pwrlabs.io');

// node
const wallet = await PWRWallet.loadWallet(pwr, 'path/to/wallet.dat');

// browser
const wallet = await PWRWallet.loadWallet(pwr, file);
```

**Get wallet address:**

```ts
const address = await wallet.getAddress();
```

**Get wallet balance:**

```ts
const balance = await wallet.getBalance();
```

**Get private key:**

```ts
const privateKey = await wallet.getPrivateKey();
```

**Transfer PWR tokens:**

```ts
const destinyAddress = '0x...';
const pwrAmount = '1000000000'; // 1 PWR = 10^9
await wallet.transferPWR(destinyAddress, BigInt(pwrAmount));
```

Sending a transcation to the PWR Chain returns a Response object, which specified if the transaction was a success, and returns relevant data.
If the transaction was a success, you can retrieive the transaction hash, if it failed, you can fetch the error.

```ts
try {
    const r = await wallet.transferPWR(destinyAddress, BigInt(pwrAmount));

    if (r.sucess) {
        console.log('Transcation Hash: ' + r.transactionHash);
    }
} catch (e) {
    console.log(e);
}
```

**Send data to a vida:**

```ts
const vidaId = BigInt('120');
const data = new TextEncoder().encode('Hello, pwr!');
const value = BigInt('1000000000'); // 1 PWR = 10^9

try {
    const r = await wallet.submitPayableVidaData(vidaId, data, value);
    if (r.sucess) {
        console.log('Transcation Hash: ' + r.transactionHash);
    }
} catch (e) {
    console.log(e);
}
```

### Other Static Calls

**Get RPC Node Url:**

Returns currently set RPC node URL.

```ts
const url = await pwrjs.getRpcNodeUrl();
```

**Get Fee Per Byte:**

Gets the latest fee-per-byte rate.

```ts
const fee = await pwrjs.getFeePerByte();
```

**Get Balance Of Address:**

Gets the balance of a specific address.

```ts
const balance = await pwrjs.getBalanceOfAddress('0x...');
```

**Get Nonce Of Address:**

Gets the nonce/transaction count of a specific address.

```ts
const nonce = await pwrjs.getNonceOfAddress('0x...');
```

**Broadcast Txn:**

Broadcasts a signed transaction to the network.

```ts
const signedTransaction = '...';
const broadcast = await pwrjs.broadcastTxn(signedTransaction);
```

## ✏️ Contributing

If you consider to contribute to this project please read [CONTRIBUTING.md](https://github.com/pwrlabs/pwrjs/blob/main/CONTRIBUTING.md) first.

You can also join our dedicated channel for [pwrjs](https://discord.com/channels/793094838509764618/927918707613786162) on the [PWR Chain Discord](https://discord.com/invite/YgsdxEx3)

## 📜 License

Copyright (c) 2025 PWR Labs

Licensed under the [MIT license](https://github.com/pwrlabs/pwrjs/blob/main/LICENSE).
