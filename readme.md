# PWRJS

PWRJS is a javasrcipt library for interacting with the PWR network. It provides an easy interface for wallet management and sending transactions on PWR.

<!-- primary badges -->
<p align="center">
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
  <a href="https://x.com/pwrlabs">
    <img src="https://img.shields.io/badge/follow_us-Twitter-blue">
  </a>
</p>

## Installation

```bash
# latest official release (main branch)
$ npm install @pwrjs/core

# or for latest pre-release version (develop branch)
$ npm install @pwrjs/core@next

# or for latest beta release version (beta branch)
$ npm install @pwrjs/core@beta
```

## 🌐 Documentation

How to [Guides](https://pwrlabs.io) 🔜 & [API](https://pwrlabs.io) 💻

Play with [Code Examples](https://github.com/keep-pwr-strong/pwr-components/) 🎮

## 💫 Getting Started

**Import the library:**

```ts
import { PWRJS, PWRWallet } from '@pwrjs/core';
// or
const { PWRJS, PWRWallet } = require('@pwrjs/core');
```

**Set your RPC node:**

```ts
const pwrjs = new PWRJS('https://pwrrpc.pwrlabs.io/');
```

**Generate a new wallet:**

```ts
const privateKey = "0xac0974bec...f80";
const wallet = new PWRWallet(privateKey);
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
await wallet.transferPWR('recipientAddress', '100');
```

Sending a transcation to the PWR Chain returns a Response object, which specified if the transaction was a success, and returns relevant data.
If the transaction was a success, you can retrieive the transaction hash, if it failed, you can fetch the error.

```ts
try {
  const r = await wallet.transferPWR('recipientAddress', 1000);

  if (r.status == true) {
    console.log('Transcation Hash: ' + r.data);
  }
} catch (e) {
  console.log(e);
}
```

**Send data to a VM:**

```ts
const vmId = 123;
const dataBytes = Buffer.from('Hello World!');

try {
  const r = await wallet.sendVMDataTxn(vmId, dataBytes);
  if (r.status == true) {
    console.log('Transcation Hash: ' + r.data);
  }
} catch (e) {
  console.log(e);
}
```

### Other Static Calls

**Get RPC Node Url:**

Returns currently set RPC node URL.

```ts
const url = await PWRJS.getRpcNodeUrl();
```

**Get Fee Per Byte: **

Gets the latest fee-per-byte rate.

```ts
const fee = await PWRJS.getFeePerByte();
```

**Get Balance Of Address:**

Gets the balance of a specific address.

```ts
const balance = await PWRJS.getBalanceOfAddress('0x...');
```

**Get Nonce Of Address:**

Gets the nonce/transaction count of a specific address.

```ts
const nonce = await PWRJS.getNonceOfAddress('0x...');
```

**Broadcast Txn:**

Broadcasts a signed transaction to the network.

```ts
const signedTransaction = "...";
const broadcast = await PWRJS.broadcastTxn(signedTransaction);
```

## ✏️ Contributing

If you consider to contribute to this project please read [CONTRIBUTING.md](https://github.com/pwrlabs/pwrjs/blob/main/CONTRIBUTING.md) first.

You can also join our dedicated channel for [pwrjs](https://discord.com/channels/793094838509764618/927918707613786162) on the [PWR Chain Discord](https://discord.com/invite/YgsdxEx3)

## 📜 License

Copyright (c) 2024 PWR Labs

Licensed under the [MIT license](https://github.com/pwrlabs/pwrjs/blob/main/LICENSE).
