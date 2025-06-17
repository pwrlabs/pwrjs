import * as bip39 from 'bip39';
import { falconKeypair } from 'rust-falcon';
import DeterministicSecureRandom from '../src/services/secure-random.service';
import PWRJS from '../src/protocol/pwrjs';
import Wallet from '../src/wallet/pwr-wallet-b';
import * as path from 'path';
import * as fs from 'fs';
// import { bytesToHex } from '@noble/hashes/utils';

async function generateWallet() {
    const mnemonic = bip39.generateMnemonic();
    const seed = bip39.mnemonicToSeedSync(mnemonic, '');
    const randomBytes = new DeterministicSecureRandom(seed).nextBytes(48);
    const keypair = falconKeypair(randomBytes);

    const pwr = new PWRJS('https://pwrrpc.pwrlabs.io');
    const falconWallet = await Wallet.fromKeys(keypair.secret, keypair.public, pwr);

    const pk = falconWallet.getPublicKey();
    const sk = falconWallet.getPrivateKey();
    const address = falconWallet.getAddress();

    const pkHex = Buffer.from(pk).toString('hex');
    const skHex = Buffer.from(sk).toString('hex');

    const content = JSON.stringify({ pk: pkHex, sk: skHex, address, mnemonic });
    const filePath = path.resolve(__dirname, '..', '__tests__', 'files', 'seed.json');
    fs.writeFileSync(filePath, content);

    // const expected_address = '0xe68191b7913e72e6f1759531fbfaa089ff02308a';
    // const expected_seed =
    //     '2246A57C783F18B07268FCF675486C3A45826C48F703062179EED5BBDF2BEE7A622EDDFEF7EDA803EC18E882CC8209893450DE472EE6049EE8C740327CA5F052';
    // const expected_random_bytes =
    //     'EF91172C58D19AE4D465C58FED214A99D60A5BED95C7919B849132D787192FF58D19D2DA2A8F83F28BECFDF603BC5F35';

    // if (expected_seed !== bytesToHex(seed).toUpperCase()) {
    //     throw new Error('Seed does not match the expected seed');
    // }
    // if (expected_random_bytes !== bytesToHex(randomBytes).toUpperCase()) {
    //     throw new Error('Random bytes do not match the expected random bytes');
    // }
    // if (expected_address !== address) {
    //     throw new Error('Address does not match the expected address');
    // }
}

async function main() {
    await generateWallet();
    console.log('Wallet generated successfully and saved to files/seed.json');
}

main();
