type Transaction = {
    positionInTheBlock: number;
    nonceOrValidationHash: string;
    size: number;
    fee: string;
    from: string;
    to: string;
    txnFee: string;
    type: string;
    hash: string;
};

export type TransferTransaction = Transaction & {
    value: string;
};

export type DataTransaction = Transaction & {
    vmId: string;
    data: string;
};
