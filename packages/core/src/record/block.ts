export type Block = {
    blockHash: string;
    networkVotingPower: number;
    success: boolean;
    blockNumber: number;
    blockReward: number;
    transactions: {
        isBundlded: boolean;
        actionFee: number;
        receiver: string;
        data: string;
        fee: number;
        type: string;
        nonce: number;
        positionInTheBlock: number;
        size: number;
        feePayer: string;
        sender: string;
        success: boolean;
        positionInBundle: number;
        blockNumber: number;
        value: number;
        hash: string;
        timestamp: number;
    }[];
    blockSubmitter: string;
    size: number;
    timestamp: number;
};
