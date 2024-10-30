export type Block = {
    processedWithoutCriticalErrors: boolean;
    blockHash: string;
    networkVotingPower: number;
    blockNumber: number;
    blockReward: number;
    transactionCount: number;
    transactions: {
        positionInTheBlock: number;
        size: number;
        receiver: string;
        sender: string;
        success: boolean;
        fee: number;
        paid: boolean;
        type: string;
        nonce: number;
        value: number;
        extraFee: number;
        hash: string;
    }[];
    blockSubmitter: string;
    blockSize: number;
    timestamp: number;
};
