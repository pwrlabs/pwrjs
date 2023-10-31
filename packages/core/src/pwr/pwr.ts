import axios from 'axios';
import { Block } from '../block/block';

function EnsureRpcNodeUrl() {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = function (...args: any[]) {
            if (!PWRJS.getRpcNodeUrl()) {
                throw new Error('RPC Node URL is not defined');
            }

            return originalMethod.apply(this, args);
        };
    };
}

export default class PWRJS {
    static #rpcNodeUrl: string;
    static #feePerByte: number = 100;

    static getRpcNodeUrl(): string {
        return PWRJS.#rpcNodeUrl;
    }

    @EnsureRpcNodeUrl()
    static async getNonceOfAddress(address: string): Promise<string> {
        const res = await axios({
            method: 'get',
            url: `${PWRJS.getRpcNodeUrl()}/nonceOfUser/?userAddress=${address}`,
        });

        if (res.data.status !== 'success') {
            throw new Error('Error getting nonce');
        }

        return res.data.data.nonce;
    }

    @EnsureRpcNodeUrl()
    static async getBalanceOfAddress(address: string): Promise<string> {
        const url = `${PWRJS.getRpcNodeUrl()}/balanceOf/?userAddress=${address}`;

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
        return PWRJS.#feePerByte;
    }

    @EnsureRpcNodeUrl()
    static async getBlocksCount(): Promise<number> {
        const url = `${PWRJS.getRpcNodeUrl()}/blocksCount/`;

        const res = await axios({
            method: 'get',
            url,
        });

        if (res.data.status !== 'success') {
            throw new Error('Error getting balance');
        }

        return res.data.data.blocksCount;
    }

    @EnsureRpcNodeUrl()
    static async getLatestBlockNumber(): Promise<Block> {
        const latestBlock = await PWRJS.getBlocksCount();

        const num = latestBlock - 1;

        const res = await PWRJS.getBlockByNumber(num);

        return res;
    }

    @EnsureRpcNodeUrl()
    static async getValidatorsCount(): Promise<number> {
        const url = `${PWRJS.getRpcNodeUrl()}/validatorsCount/`;

        const res = await axios({
            method: 'get',
            url,
        });

        if (res.data.status !== 'success') {
            throw new Error('Error getting balance');
        }

        return res.data.data.validatorsCount;
    }

    @EnsureRpcNodeUrl()
    static async getBlockByNumber(blockNumber: number): Promise<Block> {
        const url = `${PWRJS.getRpcNodeUrl()}/block/?blockNumber=${blockNumber}`;

        const res = await axios({
            method: 'get',
            url,
        });

        if (res.data.status !== 'success') {
            throw new Error('Error getting balance');
        }

        return res.data.data.block;
    }

    static updateFeePerByte(feePerByte: number) {
        PWRJS.#feePerByte = feePerByte;
    }

    static setRpcNodeUrl(rpcNodeUrl: string) {
        PWRJS.#rpcNodeUrl = rpcNodeUrl;
    }

    @EnsureRpcNodeUrl()
    static async broadcastTxn(txnBytes: Uint8Array): Promise<any[]> {
        const txnHex = Buffer.from(txnBytes).toString('hex');

        const res = await axios({
            method: 'post',
            url: `${PWRJS.getRpcNodeUrl()}/broadcast/`,
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
