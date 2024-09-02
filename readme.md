# PWRJS

PWRJS is a javascript library for interacting with the PWR blobkchain. It provides an interface for wallet management and sending transactions on PWR.

## Features

-   Generate wallets and manage keys
-   Get wallet details such as balance, address, private key, etc.
-   Build, sign and broadcast transactions
-   Transfer PWR tokens
-   Send data to PWR virtual machines
-   Interact with PWR nodes via RPC

## Getting Started

### Prerequisites

-   nodejs v20.x.x or higher

### Installation

PWRJ is available on NPM. Add it as a dependency

```bash
    npm install @pwrjs/core
```

### Usage

**Import the library:**

```ts
import { PWRJS, PWRWallet } from '@pwrjs/core';
```

**Create a new instance**

```ts
const pwrjs = new PWRJS('https://pwrrpc.pwrlabs.io/');
```

**Generate a new wallet:**

```ts
const privateKey = '0x...';
const wallet = new PWRWallet(privateKey);
```

**Get wallet address:**

```ts
string address = wallet.getAddress();
```

**Get wallet balance:**

```ts
const balance = wallet.getBalance();
```

**Get private key:**

```ts
const privateKey = wallet.getPrivateKey();
```

**Transfer PWR tokens:**

```ts
wallet.transferPWR('recipientAddress', '1000');
```

Sending a transcation to the PWR Chain returns a Response object, which specified if the transaction was a success, and returns relevant data.
If the transaction was a success, you can retrieive the transaction hash, if it failed, you can fetch the error.

```ts
try {
    const r = wallet.transferPWR('recipientAddress', 1000);

    if (r.status === 'success') {
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
    const r = wallet.sendVMDataTxn(vmId, dataBytes);
    if (r.status === 'success') {
        console.log('Transcation Hash: ' + r.data);
    }
} catch (e) {
    console.log(e);
}
```

### Other Static Calls

**Update fee per byte:**

Fetches latest fee-per-byte rate from the RPC node and updates the local fee rate.

```ts
PWRJS.updateFeePerByte();
```

**Get RPC Node Url:**

Returns currently set RPC node URL.

```ts
const url = PWRJS.getRpcNodeUrl();
```

**Get Fee Per Byte: **

Gets the latest fee-per-byte rate.

```ts
const fee = PWRJS.getFeePerByte();
```

**Get Balance Of Address:**

Gets the balance of a specific address.

```ts
const balance = PWRJS.getBalanceOfAddress('0x...');
```

**Get Nonce Of Address:**

Gets the nonce/transaction count of a specific address.

```ts
const nonce = PWRJS.getNonceOfAddress('0x...');
```

**Broadcast Txn:**

Broadcasts a signed transaction to the network.

```ts
const signedTransaction = ...;
PWRJS.broadcastTxn(signedTransaction);
```

## Contributing

Pull requests are welcome!

For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
