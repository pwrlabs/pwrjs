export default class PwrWallet {
    #private;
    get address(): string;
    constructor(privateKey: string);
    getBalance(): Promise<any>;
    getTransactions(): Promise<any>;
    sendTransaction(recipient: string, amount: string): Promise<any>;
}
