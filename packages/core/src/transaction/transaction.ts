type Transaction = {
    size: number;
    positionInTheBlock: number;
    fee: string;
    type: string;
    from: string;
    to: string;
    nonceOrValidationHash: string;
    txnFee: string;
    hash: string;
};

export type TransferTransaction = Transaction & {
    value: string;
};

export type DataTransaction = Transaction & {
    vmId: string;
    data: string;
};
