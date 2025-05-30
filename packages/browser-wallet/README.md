# PWRJS

PWRJS is a JavaScript library for interacting with the PWR blobkchain. It provides an interface for wallet management and sending transactions on PWR.

```bash
# latest official release (main branch)
$ npm install @pwrjs/browser-wallet

# or for latest pre-release version (develop branch)
$ npm install @pwrjs/browser-wallet@next

# or for latest beta release version (beta branch)
$ npm install @pwrjs/browser-wallet@beta
```

## 🌐 Documentation

How to [Guides](https://pwrlabs.io) 🔜 & [API](https://pwrlabs.io) 💻

Play with [Code Examples](https://github.com/keep-pwr-strong/pwr-examples/) 🎮

## 💫 Getting Started

**Import the library:**

```ts
import { 
    BrowserWallet, connect, disconnect, 
    getEvent, getConnection, isInstalled 
} from "@pwrjs/browser-wallet";
// or
const { 
	BrowserWallet, connect, disconnect, 
	getEvent, getConnection, isInstalled 
} = require('@pwrjs/browser-wallet');
```

**Simple Example:**

```js
import { 
    BrowserWallet, connect, disconnect, 
    getEvent, getConnection, isInstalled 
} from "@pwrjs/browser-wallet";

// connect pwr wallet in the browser
connect().then();
// disconnect pwr wallet
disconnect().then();

// send txs from pwr wallet in the browser
const wallet = new BrowserWallet();
wallet.transferPWR('recipientAddress', 1000).then(console.log);

// listen if the user changes accounts
getEvent("onAccountChange", (accounts) => {
    // check if there's accounts connected
    (accounts.length) && console.log(`Account address: ${accounts[0]}`);
})
```

## ✏️ Contributing

If you consider to contribute to this project please read [CONTRIBUTING.md](https://github.com/pwrlabs/pwrjs/blob/main/CONTRIBUTING.md) first.

You can also join our dedicated channel for [pwrjs](https://discord.com/channels/793094838509764618/927918707613786162) on the [PWR Chain Discord](https://discord.com/invite/YgsdxEx3)

## 📜 License

Copyright (c) 2025 PWR Labs

Licensed under the [MIT license](https://github.com/pwrlabs/pwrjs/blob/main/LICENSE).
