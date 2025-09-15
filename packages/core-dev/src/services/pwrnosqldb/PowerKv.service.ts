import CryptoService from '../crypto.service';

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
    private readonly serverUrl: string = 'https://powerkvbe.pwrlabs.io';

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

    private hash256(input: Uint8Array): Uint8Array {
        // Using Web Crypto API for SHA3-256 (Keccak256)
        // Note: In browser/Node.js environment, we'll use the crypto service
        const crypto = require('crypto');
        return new Uint8Array(crypto.createHash('sha3-256').update(input).digest());
    }

    private packData(key: Uint8Array, data: Uint8Array): Uint8Array {
        // Allocate buffer: 4 bytes (key length) + key + 4 bytes (data length) + data
        const totalLength = 4 + key.length + 4 + data.length;
        const buffer = new Uint8Array(totalLength);
        const view = new DataView(buffer.buffer);
        
        let offset = 0;
        // Write key length (4 bytes, big-endian)
        view.setUint32(offset, key.length, false);
        offset += 4;
        // Write key bytes
        buffer.set(key, offset);
        offset += key.length;
        // Write data length (4 bytes, big-endian)
        view.setUint32(offset, data.length, false);
        offset += 4;
        // Write data bytes
        buffer.set(data, offset);
        
        return buffer;
    }

    private unpackData(packedBuffer: Uint8Array): { key: Uint8Array; data: Uint8Array } {
        const view = new DataView(packedBuffer.buffer, packedBuffer.byteOffset, packedBuffer.byteLength);
        let offset = 0;
        
        // Read key length (4 bytes, big-endian)
        const keyLength = view.getUint32(offset, false);
        offset += 4;
        
        // Read key bytes
        const key = packedBuffer.slice(offset, offset + keyLength);
        offset += keyLength;
        
        // Read data length (4 bytes, big-endian)
        const dataLength = view.getUint32(offset, false);
        offset += 4;
        
        // Read data bytes
        const data = packedBuffer.slice(offset, offset + dataLength);
        
        return { key, data };
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

        // Hash the key with Keccak256
        const keyHash = this.hash256(keyBytes);
        
        // Pack the original key and data
        const packedData = this.packData(keyBytes, dataBytes);
        
        // Encrypt the packed data
        const encryptedData = await CryptoService.encryptNode(packedData, this.secret);

        const url = this.serverUrl + '/storeData';
        const payload: StoreDataRequest = {
            projectId: this.projectId,
            secret: this.secret,
            key: this.toHexString(keyHash),
            value: this.toHexString(encryptedData)
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
                throw new PowerKvError(`storeData failed: ${response.status} - ${responseText}`);
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

        // Hash the key with Keccak256
        const keyHash = this.hash256(keyBytes);
        const keyHex = this.toHexString(keyHash);
        
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
                    const valueHex = responseObj.value;
                    
                    // Handle both with/without 0x prefix
                    let cleanHex = valueHex;
                    if (cleanHex.startsWith('0x') || cleanHex.startsWith('0X')) {
                        cleanHex = cleanHex.substring(2);
                    }
                    
                    const encryptedValue = this.fromHexString(cleanHex);
                    
                    // Decrypt the data
                    const decryptedData = await CryptoService.decryptNode(encryptedValue, this.secret);
                    
                    // Unpack the data to get original key and data
                    const { key: originalKey, data: actualData } = this.unpackData(decryptedData);
                    
                    return actualData;
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
