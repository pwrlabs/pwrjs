export type Transaction = {
    size: number;
    blockNumber: BigInt;
    positionInTheBlock: number;
    fee: string;
    type: string;
    sender: string;
    receiver: string;
    nonce: number;
    hash: string;
    timestamp: number;
    value: string;
    rawTransaction: string;
    chainId: string;
};
