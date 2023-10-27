import axios from 'axios';

export default class PWR {
    static #rpcNodeUrl: string = 'https://pwrexplorerbackend.pwrlabs.io';
    static #feePerByte: number = 100;

    static getRpcNodeUrl(): string {
        return PWR.#rpcNodeUrl;
    }

    static async getNonceOfAddress(address: string): Promise<string> {
        const res = await axios({
            method: 'get',
            url: `${PWR.getRpcNodeUrl()}/nonceOfUser/?userAddress=${address}`,
        });

        if (res.data.status !== 'success') {
            throw new Error('Error getting nonce');
        }

        return res.data.data.nonce;
    }

    static async getBalanceOfAddress(address: string): Promise<string> {
        const url = `${PWR.getRpcNodeUrl()}/balanceOf/?userAddress=${address}`;

        const res = await axios({
            method: 'get',
            url,
        });

        if (res.data.status !== 'success') {
            throw new Error('Error getting balance');
        }

        return res.data.data.balance;
    }

    static getFeePerByte() {
        return PWR.#feePerByte;
    }

    static updateFeePerByte(feePerByte: number) {
        PWR.#feePerByte = feePerByte;
    }

    static setRpcNodeUrl(rpcNodeUrl: string) {
        PWR.#rpcNodeUrl = rpcNodeUrl;
    }

    static async broadcastTxn(txnBytes: Uint8Array): Promise<any[]> {
        const txnHex = Buffer.from(txnBytes).toString('hex');

        const res = await axios({
            method: 'post',
            url: `${PWR.getRpcNodeUrl()}/broadcast/`,
            data: {
                txn: txnHex,
            },
        });

        if (res.data.status !== 'success') {
            throw new Error('Error sending transaction');
        }

        return res.data.data;
    }
}
