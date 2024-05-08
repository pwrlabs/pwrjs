export type Block = {
    blockHash: string;
    success: boolean;
    blockNumber: number;
    blockReward: string;
    transactionCount: number;
    transactions: [];
    blockSubmitter: string;
    blockSize: number;
    timestamp: number;
};
