import { validateMnemonic } from 'bip39';
import WalletUtils from './wallet.utils';
import PwrWallet from './wallet/wallet';

import axios from 'axios';

class PWR {
    #baseUrl = 'https://pwrexplorerbackend.pwrlabs.io';

    static createWallet(): { wallet: PwrWallet; mnemonic: string } {
        const mnemonic = WalletUtils.generateMnemonic();
        const wallet = WalletUtils.getWalletFromMnemonic(mnemonic);

        const pwrWallet = new PwrWallet(wallet.getPrivateKeyString());

        return {
            wallet: pwrWallet,
            mnemonic,
        };
    }

    static importWalletFromMnemonic(mnemonic: string): PwrWallet {
        const valid = validateMnemonic(mnemonic);

        if (!valid) {
            throw new Error('Invalid mnemonic');
        }

        const wallet = WalletUtils.getWalletFromMnemonic(mnemonic);
        const pwrWallet = new PwrWallet(wallet.getPrivateKeyString());

        return pwrWallet;
    }

    static importWalletFromPrivateKey(privateKey: string): PwrWallet {
        const wallet = WalletUtils.fromPrivateKey(privateKey);
        const pwrWallet = new PwrWallet(wallet.getPrivateKeyString());

        return pwrWallet;
    }

    static async getBalance(address: string): Promise<string> {
        const res = await axios({
            method: 'get',
            url: `https://pwrexplorerbackend.pwrlabs.io/balanceOf/userAddress=${address}`,
        });

        if (res.data.status !== 'success') {
            throw new Error('Error getting balance');
        }

        return res.data.data.balance;
    }

    static async getTransactions(address: string): Promise<any[]> {
        const res = await axios({
            method: 'get',
            url: `https://pwrexplorerbackend.pwrlabs.io/transactionsOf/userAddress=${address}`,
        });

        if (res.data.status !== 'success') {
            throw new Error('Error getting transactions');
        }

        return res.data.data.txns;
    }
}

const { wallet } = PWR.createWallet();

async function main() {
    try {
        const res = await axios({
            method: 'post',
            url: `https://pwrfaucet.pwrlabs.io/claimPWR/?userAddress=${wallet.address}`,
        });

        console.log('wallet', wallet.address);

        // sleep 2 seconds
        await new Promise((resolve) => setTimeout(resolve, 15 * 1000));

        const balance = await wallet.getBalance();

        const p = {
            address: wallet.address,
            balance,
        };

        if (balance > 0) {
            console.log('wallet', p);

            const res2 = await wallet.sendTransaction(
                '0xcad2114baa0def4b94771e6be5d4044185702b65',
                '1000000000 '
            );

            console.log(res2);
        }
    } catch (err) {
        console.log(err.message);
    }
}

main();
