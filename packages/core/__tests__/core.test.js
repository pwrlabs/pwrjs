'use strict';

const core = require('..');

describe('core', () => {
    it('needs tests');
});
// async function testWallet() {
//     // try {
//     console.log('testing wallet');

//     const pk = wallet.getPrivateKey();
//     const address = wallet.getAddress();
//     const nonce = await wallet.getNonce();

//     console.log('props', {
//         pk,
//         address,
//         nonce,
//     });

//     const res = await axios({
//         method: 'post',
//         url: `https://pwrfaucet.pwrlabs.io/claimPWR/?userAddress=${wallet.getAddress()}`,
//     });

//     await new Promise((resolve) => setTimeout(resolve, 10 * 1000));
//     const balance = await wallet.getBalance();

//     console.log('balance', BigNumber(balance).shiftedBy(-9).toString());

//     //     console.log('wallet', wallet.address);

//     try {
//         if (balance > 0) {
//             const res2 = await wallet.transferPWR(
//                 '0xcad2114baa0def4b94771e6be5d4044185702b65',
//                 BigNumber(1).shiftedBy(9).toString()
//             );

//             await new Promise((resolve) => setTimeout(resolve, 5 * 1000));

//             console.log(res2);

//             const bal2 = await wallet.getBalance();
//             const bal2Dec = BigNumber(bal2).shiftedBy(-9).toString();

//             const p2 = {
//                 balance: bal2Dec,
//                 // txns: await wallet.(),
//             };

//             console.log('wallet second state', p2);

//             await new Promise((res) => setTimeout(res, 5 * 1000));

//             console.log('------------------ data txn ------------------');

//             const data = 'Hello World';
//             const dataBytes = Buffer.from(data);

//             const dataTxn = await wallet.sendVMDataTxn('8', dataBytes);

//             console.log('data txn', dataTxn);
//         }
//     } catch (err) {
//         console.log(err.message);
//     }
// }

// async function testTool() {
//     const rpc = PWR.getRpcNodeUrl();
//     const fee = PWR.getFeePerByte();

//     console.log('props', {
//         rpc,
//         fee,
//     });

//     const address = wallet.getAddress();

//     try {
//         const balance = await PWR.getBalanceOfAddress(address);
//         const nonce = await PWR.getNonceOfAddress(address);

//         console.log({
//             balance,
//             nonce,
//         });
//     } catch (err) {
//         console.log(err.message);
//     }
// }

// async function main() {
//     // await testWallet();
//     await testTool();
// }

// main();
