import axios from 'axios';
import { Block } from '../record/block';
import { VmDataTransaction } from '../record/vmDataTransaction';
import { Validator } from '../record/validator';
import TransactionDecoder from './transaction-decoder';
import { Transaction_ID } from '../static/enums/transaction.enum';

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
    static #ecdsaVerificationFee: number = 10000;

    // *~~*~~*~~ ~ *~~*~~*~~ //

    static getRpcNodeUrl(): string {
        return PWRJS.#rpcNodeUrl;
    }

    static getFeePerByte() {
        return PWRJS.#feePerByte;
    }

    static getEcsaVerificationFee() {
        return PWRJS.#ecdsaVerificationFee;
    }

    static async getChainId(): Promise<number> {
        const res = await axios({
            method: 'get',
            url: `${PWRJS.getRpcNodeUrl()}/chainId/`,
        });

        return res.data.chainId;
    }

    static async getBlockchainVersion(): Promise<number> {
        const res = await axios({
            method: 'get',
            url: `${PWRJS.getRpcNodeUrl()}/blockchainVersion/`,
        });

        return res.data.blockchainVersion;
    }

    // *~~*~~*~~ ~ *~~*~~*~~ //

    static async getFee(txn: Uint8Array) {
        const feePerByte = PWRJS.getFeePerByte();
        const ecdsaVerificationFee = PWRJS.getEcsaVerificationFee();

        const decoder = new TransactionDecoder();
        const transaction = decoder.decode(txn) as unknown as {
            sender: string;
            nonce: string;
            size: number;
            rawTransaction: Uint8Array;
            chainId: number;
            transactions: { size: number }[];
            type: number;
        };

        if (transaction.type === Transaction_ID.GUARDIAN_TXN) {
            const guardianApprovalTransaction = transaction;

            const sizeOfAllTransactions =
                guardianApprovalTransaction.transactions.reduce(
                    (acc, curr) => acc + curr.size,
                    0
                );

            let fee = txn.length * feePerByte + ecdsaVerificationFee;
            fee += sizeOfAllTransactions * ecdsaVerificationFee;
            return fee;
        } else {
            return txn.length * feePerByte + ecdsaVerificationFee;
        }
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

    static async getVMDataTransactions(
        startingBlock: string,
        endingBlock: string,
        vmId: string
    ): Promise<VmDataTransaction[]> {
        const res = await axios({
            method: 'get',
            url: `${PWRJS.getRpcNodeUrl()}/getVmTransactions/?startingBlock=${startingBlock}&endingBlock=${endingBlock}&vmId=${vmId}`,
        });

        const transactions: VmDataTransaction[] = res.data.transactions;
        const txnArray = new Array(transactions.length);

        for (let i = 0; i < transactions.length; i++) {
            const transaction = transactions[i];
            txnArray[i] = transaction;
        }

        return txnArray;
    }

    static async getVMDataTransactionsFiltered() {}

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
    static async getStandbyValidatorsCount(): Promise<number> {
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
    static async getTotalDelegatorsCount(): Promise<number> {
        const res = await axios({
            method: 'get',
            url: `${PWRJS.getRpcNodeUrl()}/totalDelegatorsCount/`,
        });

        return res.data.delegatorsCount;
    }

    @EnsureRpcNodeUrl()
    static async getAllValidators(): Promise<Validator[]> {
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

    @EnsureRpcNodeUrl()
    static async getValidator(address: string): Promise<Validator> {
        const url = `${PWRJS.getRpcNodeUrl()}/validator/?validatorAddress=${address}`;

        const res = await axios({
            method: 'get',
            url,
        });

        return res.data.validator;
    }

    @EnsureRpcNodeUrl()
    static async getDelegatees(address: string): Promise<Validator[]> {
        const url = `${PWRJS.getRpcNodeUrl()}/delegateesOfUser/?userAddress=${address}`;

        const res = await axios({
            method: 'get',
            url,
        });

        return res.data.validators;
    }

    @EnsureRpcNodeUrl()
    static async getDelegatedPWR(
        delegatorAddress: string,
        validatorAddress: string
    ) {
        const res = await axios({
            method: 'get',
            url: `${PWRJS.getRpcNodeUrl()}/validator/delegator/delegatedPWROfAddress/?userAddress=${delegatorAddress}&validatorAddress=${validatorAddress}`,
        });

        return res.data;
    }

    @EnsureRpcNodeUrl()
    static async getShareValue(validator: string) {
        const res = await axios({
            method: 'get',
            url: `${PWRJS.getRpcNodeUrl()}/validator/shareValue/?validatorAddress=${validator}`,
        });

        return res.data.shareValue;
    }

    // *~~*~~*~~ ~ VM ~ *~~*~~*~~ //

    static getVmIdAddress(vmId: number): string {
        let hexAddress: string = vmId >= 0 ? '1' : '0';

        if (vmId < 0) vmId = -vmId;

        const vmIdString: string = vmId.toString();

        for (let i = 0; i < 39 - vmIdString.length; i++) {
            hexAddress += '0';
        }

        hexAddress += vmIdString;

        return '0x' + hexAddress;
    }

    static isVmAddress(address: string) {
        if (
            address == null ||
            (address.length !== 40 && address.length !== 42)
        ) {
            return false;
        }

        if (address.startsWith('0x')) {
            address = address.substring(2);
        }

        if (!address.startsWith('0') && !address.startsWith('1')) {
            return false;
        }

        const negative = address.startsWith('0');
        if (!negative) {
            address = address.substring(1);
        }

        const maxLong = BigInt('9223372036854775807');
        const minLong = BigInt('-9223372036854775808');

        let vmId;
        try {
            vmId = BigInt(address);
            if (negative) {
                vmId = -vmId;
            }
        } catch (error) {
            return false;
        }

        if (vmId > maxLong || vmId < minLong) {
            return false;
        }

        return true;
    }

    @EnsureRpcNodeUrl()
    static async getOwnerOfVm(vmId: string): Promise<any> {
        const res = await axios({
            method: 'get',
            url: `${PWRJS.getRpcNodeUrl()}/ownerOfVmId/?vmId=${vmId}`,
        });

        return res.data.claimed;
    }

    static async getConduitsOfVm(vmId: string): Promise<Validator[]> {
        const res = await axios({
            method: 'get',
            url: `${PWRJS.getRpcNodeUrl()}/conduitsOfVm/?vmId=${vmId}`,
        });

        const validators = res.data.conduits;

        return validators;
    }

    // *~~*~~*~~ ~ *~~*~~*~~ //

    static updateFeePerByte(feePerByte: number) {
        PWRJS.#feePerByte = feePerByte;
    }

    static setRpcNodeUrl(rpcNodeUrl: string) {
        PWRJS.#rpcNodeUrl = rpcNodeUrl;
    }

    // *~~*~~*~~ ~ guardian ~ *~~*~~*~~ //

    static async getGuardianOfAddress(address: string) {
        const res = await axios({
            method: 'get',
            url: `${PWRJS.getRpcNodeUrl()}/guardianOf/?userAddress=${address}`,
        });

        if (res.data.isGuarded === false) return null;

        return res.data.guardian;
    }

    // *~~*~~*~~ ~ *~~*~~*~~ //

    static async isTransactionValidForGuardianApproval(txn: string) {
        const res = await axios({
            method: 'post',
            url: `${PWRJS.getRpcNodeUrl()}/isTransactionValidForGuardianApproval/`,
            data: {
                transaction: txn,
            },
        });

        // implement logic for false response

        return res.data;
    }

    static async getActiveVotingPower() {
        const res = await axios({
            method: 'get',
            url: `${PWRJS.getRpcNodeUrl()}/activeVotingPower/`,
        });

        return res.data.activeVotingPower;
    }

    // *~~*~~*~~ ~ *~~*~~*~~ //
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
