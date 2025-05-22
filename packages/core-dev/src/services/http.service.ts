import { TransactionResponse } from '../wallet/wallet.types';

class HttpService {
    constructor(private baseUrl: string) {}

    // Method to perform a GET request
    public async get<T>(path: string): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        const response = await fetch(url);

        // Check if the response was successful
        if (!response.ok) {
            // log error details
            const j = await response.json();

            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return response.json() as Promise<T>;
    }

    // Method to perform a POST request
    public async post<T>(path: string, data?: any): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: data ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return response.json() as Promise<T>;
    }

    async broadcastTxn(rpc: string, txnHex: string, txnHash: string): Promise<TransactionResponse> {
        const url = `${rpc}/broadcast`;

        try {
            const raw = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    txn: txnHex,
                }),
            });

            const res = await raw.json();

            if (!raw.ok) {
                return {
                    success: false,
                    transactionHash: '0x' + txnHash,
                    message: res.message,
                };
            }

            return {
                success: true,
                transactionHash: '0x' + txnHash,
                message: null,
            };
        } catch (err) {
            throw err;
        }
    }

    // Additional methods for PUT, DELETE, etc. can be added here using similar patterns
}

export default HttpService;
