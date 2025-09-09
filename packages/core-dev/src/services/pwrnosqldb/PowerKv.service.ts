export type PowerKvKey = string | Uint8Array | number;
export type PowerKvValue = string | Uint8Array | number;

export interface StoreDataRequest {
    projectId: string;
    secret: string;
    key: string;
    value: string;
}

export interface GetValueResponse {
    value: string;
}

export interface ErrorResponse {
    message?: string;
}

export class PowerKvError extends Error {
    constructor(message: string, public readonly cause?: Error) {
        super(message);
        this.name = 'PowerKvError';
    }
}

export class PowerKv {
    private readonly projectId: string;
    private readonly secret: string;
    private readonly serverUrl: string = 'https://pwrnosqlvida.pwrlabs.io/';

    constructor(projectId: string, secret: string) {
        if (!projectId || projectId.trim() === '') {
            throw new PowerKvError('Project ID cannot be null or empty');
        }
        if (!secret || secret.trim() === '') {
            throw new PowerKvError('Secret cannot be null or empty');
        }

        this.projectId = projectId;
        this.secret = secret;
    }

    public getServerUrl(): string {
        return this.serverUrl;
    }

    public getProjectId(): string {
        return this.projectId;
    }

    private toHexString(data: Uint8Array): string {
        return Array.from(data)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
    }

    private fromHexString(hexString: string): Uint8Array {
        // Handle both with and without 0x prefix
        let hex = hexString;
        if (hex.startsWith('0x') || hex.startsWith('0X')) {
            hex = hex.substring(2);
        }

        if (hex.length % 2 !== 0) {
            throw new PowerKvError('Invalid hex string length');
        }

        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            const byte = parseInt(hex.substr(i, 2), 16);
            if (isNaN(byte)) {
                throw new PowerKvError('Invalid hex string');
            }
            bytes[i / 2] = byte;
        }
        return bytes;
    }

    private toBytes(data: PowerKvKey | PowerKvValue): Uint8Array {
        if (data === null || data === undefined) {
            throw new PowerKvError('Data cannot be null or undefined');
        }

        if (data instanceof Uint8Array) {
            return data;
        } else if (typeof data === 'string') {
            return new TextEncoder().encode(data);
        } else if (typeof data === 'number') {
            return new TextEncoder().encode(data.toString());
        }
        
        throw new PowerKvError('Data must be a string, Uint8Array, or number');
    }

    public async put(key: Uint8Array, data: Uint8Array): Promise<boolean>;
    public async put(key: PowerKvKey, value: PowerKvValue): Promise<boolean>;
    public async put(key: PowerKvKey | Uint8Array, data: PowerKvValue | Uint8Array): Promise<boolean> {
        let keyBytes: Uint8Array;
        let dataBytes: Uint8Array;

        // Handle the byte array overload
        if (key instanceof Uint8Array && data instanceof Uint8Array) {
            keyBytes = key;
            dataBytes = data;
        } else {
            // Handle the Object overload
            if (key === null || key === undefined) {
                throw new PowerKvError('Key cannot be null');
            }
            if (data === null || data === undefined) {
                throw new PowerKvError('Data cannot be null');
            }

            keyBytes = this.toBytes(key as PowerKvKey);
            dataBytes = this.toBytes(data as PowerKvValue);
        }

        const url = this.serverUrl + '/storeData';
        const payload: StoreDataRequest = {
            projectId: this.projectId,
            secret: this.secret,
            key: this.toHexString(keyBytes),
            value: this.toHexString(dataBytes)
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const responseText = await response.text();

            if (response.status === 200) {
                return true;
            } else {
                let message: string;
                try {
                    const errorObj: ErrorResponse = JSON.parse(responseText);
                    message = errorObj.message || `HTTP ${response.status}`;
                } catch (parseErr) {
                    message = `HTTP ${response.status} — ${responseText}`;
                }
                throw new PowerKvError(`storeData failed: ${message}`);
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new PowerKvError('Request timeout');
            }
            if (error instanceof PowerKvError) {
                throw error;
            }
            throw new PowerKvError('Network error', error as Error);
        }
    }

    public async getValue(key: Uint8Array): Promise<Uint8Array>;
    public async getValue(key: PowerKvKey): Promise<Uint8Array>;
    public async getValue(key: PowerKvKey | Uint8Array): Promise<Uint8Array> {
        let keyBytes: Uint8Array;

        // Handle the byte array overload
        if (key instanceof Uint8Array) {
            if (key === null) {
                throw new PowerKvError('Key cannot be null');
            }
            keyBytes = key;
        } else {
            // Handle the Object overload  
            if (key === null || key === undefined) {
                throw new PowerKvError('Key cannot be null');
            }
            keyBytes = this.toBytes(key);
        }

        const keyHex = this.toHexString(keyBytes);
        
        const url = `${this.serverUrl}/getValue?projectId=${encodeURIComponent(this.projectId)}&key=${keyHex}`;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const responseText = await response.text();

            if (response.status === 200) {
                try {
                    const responseObj: GetValueResponse = JSON.parse(responseText);
                    return this.fromHexString(responseObj.value);
                } catch (parseErr) {
                    throw new PowerKvError(`Unexpected response shape from /getValue: ${responseText}`);
                }
            } else {
                let message: string;
                try {
                    const errorObj: ErrorResponse = JSON.parse(responseText);
                    message = errorObj.message || `HTTP ${response.status}`;
                } catch (parseErr) {
                    message = `HTTP ${response.status} — ${responseText}`;
                }
                throw new PowerKvError(`getValue failed: ${message}`);
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new PowerKvError('GET /getValue failed (network/timeout)');
            }
            if (error instanceof PowerKvError) {
                throw error;
            }
            throw new PowerKvError('Network error', error as Error);
        }
    }

    public async getStringValue(key: PowerKvKey): Promise<string> {
        const data = await this.getValue(key);
        return new TextDecoder().decode(data);
    }

    public async getIntValue(key: PowerKvKey): Promise<number> {
        const data = await this.getValue(key);
        const str = new TextDecoder().decode(data);
        return parseInt(str, 10);
    }

    public async getLongValue(key: PowerKvKey): Promise<number> {
        const data = await this.getValue(key);
        const str = new TextDecoder().decode(data);
        return parseInt(str, 10);
    }

    public async getDoubleValue(key: PowerKvKey): Promise<number> {
        const data = await this.getValue(key);
        const str = new TextDecoder().decode(data);
        return parseFloat(str);
    }
}
