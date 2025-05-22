// export type Block = {
//     blockHash: string;
//     networkVotingPower: number;
//     success: boolean;
//     blockNumber: number;
//     blockReward: number;
//     transactions: {
//         isBundlded: boolean;
//         actionFee: number;
//         receiver: string;
//         data: string;
//         fee: number;
//         type: string;
//         nonce: number;
//         positionInTheBlock: number;
//         size: number;
//         feePayer: string;
//         sender: string;
//         success: boolean;
//         positionInBundle: number;
//         blockNumber: number;
//         value: number;
//         hash: string;
//         timestamp: number;
//     }[];
//     blockSubmitter: string;
//     size: number;
//     timestamp: number;
// };

export type Block = {
    blockNumber: number;
    timeStamp: EpochTimeStamp;
    blockReward: number;
    burnedFees: number;
    size: number;
    blockchainVersion: number;
    blockHash: string;
    previousBlockHash: string;
    rootHash: string;
    proposer: string;
    transactions?: {
        transactionHash: string;
        vidaId: number;
    }[];
    processedWithoutCriticalErrors: boolean;
};
