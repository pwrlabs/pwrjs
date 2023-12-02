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

    // *~~*~~*~~ ~ *~~*~~*~~ //

    static getRpcNodeUrl(): string {
        return PWRJS.#rpcNodeUrl;
    }

    static getFeePerByte() {
        return PWRJS.#feePerByte;
    }

    // *~~*~~*~~ ~ *~~*~~*~~ //

    @EnsureRpcNodeUrl()
    static async getNonceOfAddress(address: string): Promise<string> {
        const res = await axios({
            method: 'get',
            url: `${PWRJS.getRpcNodeUrl()}/nonceOfUser/?userAddress=${address}`,
        });

        return res.data.nonce;
    }

    @EnsureRpcNodeUrl()
    static async getBalanceOfAddress(address: string): Promise<string> {
        const url = `${PWRJS.getRpcNodeUrl()}/balanceOf/?userAddress=${address}`;

        const res = await axios({
            method: 'get',
            url,
        });

        return res.data.balance;
    }

    // *~~*~~*~~ ~ *~~*~~*~~ //

    @EnsureRpcNodeUrl()
    static async getBlocksCount(): Promise<number> {
        const url = `${PWRJS.getRpcNodeUrl()}/blocksCount/`;

        const res = await axios({
            method: 'get',
            url,
        });

        return res.data.blocksCount;
    }

    @EnsureRpcNodeUrl()
    static async getLatestBlockNumber(): Promise<Block> {
        const latestBlock = await PWRJS.getBlocksCount();

        const num = latestBlock - 1;

        const res = await PWRJS.getBlockByNumber(num);

        return res;
    }

    @EnsureRpcNodeUrl()
    static async getBlockByNumber(blockNumber: number): Promise<Block> {
        const url = `${PWRJS.getRpcNodeUrl()}/block/?blockNumber=${blockNumber}`;

        const res = await axios({
            method: 'get',
            url,
        });

        return res.data.block;
    }

    // *~~*~~*~~ ~ *~~*~~*~~ //

    @EnsureRpcNodeUrl()
    static async getTotalValidatorsCount(): Promise<number> {
        const url = `${PWRJS.getRpcNodeUrl()}/totalValidatorsCount/`;

        const res = await axios({
            method: 'get',
            url,
        });

        return res.data.validatorsCount;
    }

    @EnsureRpcNodeUrl()
    static async getSandbyValidatorsCount(): Promise<number> {
        const url = `${PWRJS.getRpcNodeUrl()}/standbyValidatorsCount/`;

        const res = await axios({
            method: 'get',
            url,
        });

        return res.data.validatorsCount;
    }

    @EnsureRpcNodeUrl()
    static async getActiveValidatorsCount(): Promise<number> {
        const url = `${PWRJS.getRpcNodeUrl()}/activeValidatorsCount/`;

        const res = await axios({
            method: 'get',
            url,
        });

        return res.data.validatorsCount;
    }

    @EnsureRpcNodeUrl()
    static async getAllValidators(): Promise<[]> {
        const url = `${PWRJS.getRpcNodeUrl()}/allValidators/`;

        const res = await axios({
            method: 'get',
            url,
        });

        return res.data.validators;
    }

    @EnsureRpcNodeUrl()
    static async getStandbyValidators(): Promise<[]> {
        const url = `${PWRJS.getRpcNodeUrl()}/standbyValidators/`;

        const res = await axios({
            method: 'get',
            url,
        });

        return res.data.validators;
    }

    @EnsureRpcNodeUrl()
    static async getActiveValidators(): Promise<[]> {
        const url = `${PWRJS.getRpcNodeUrl()}/activeValidators/`;

        const res = await axios({
            method: 'get',
            url,
        });

        return res.data.validators;
    }

    // *~~*~~*~~ ~ *~~*~~*~~ //

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

        return res.data;
    }
}
