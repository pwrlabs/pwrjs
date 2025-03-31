export type TransactionResponse = {
    success: boolean;
    transactionHash: string;
    message: string;
};

export type ConnectionTypes = {
    id: number;
    name: string;
    publicKey: string;
    privateKey: string;
    address: string;
};
