export type Transaction = {
    size: number;
    blockNumber: number;
    positionInTheBlock: number;
    fee: string;
    type: string;
    sender: string;
    receiver: string;
    nonce: number;
    hash: string;
    timestamp: number;
    value: string;
    extraFee: string;
    rawTransaction: string;
    chainId: number;
    errorMeage: string;
    success: boolean;
};
