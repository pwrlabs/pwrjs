import {
    DataTransaction,
    TransferTransaction,
} from '../transaction/transaction';

export type Block = {
    blockHash: string;
    success: boolean;
    blockNumber: number;
    blockReward: string;
    transactionCount: number;
    transactions: Array<TransferTransaction | DataTransaction>;
    blockSubmitter: string;
    blockSize: number;
    timestamp: number;
};
