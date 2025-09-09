import { PowerKv, PowerKvKey, PowerKvValue, PowerKvError } from './PowerKv.service';

class ByteArrayWrapper {
    private readonly bytes: Uint8Array;
    private readonly hash: string;

    constructor(bytes: Uint8Array) {
        this.bytes = new Uint8Array(bytes);
        this.hash = Array.from(bytes)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
    }

    public equals(other: ByteArrayWrapper): boolean {
        if (this.bytes.length !== other.bytes.length) {
            return false;
        }
        for (let i = 0; i < this.bytes.length; i++) {
            if (this.bytes[i] !== other.bytes[i]) {
                return false;
            }
        }
        return true;
    }

    public toString(): string {
        return this.hash;
    }
}

export default class PowerKvCached {
    private readonly db: PowerKv;
    private readonly cache = new Map<string, Uint8Array>();
    private isShutdown = false;
    private readonly activeWrites = new Set<string>();

    constructor(projectId: string, secret: string) {
        this.db = new PowerKv(projectId, secret);
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

    private arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
        if (a.length !== b.length) {
            return false;
        }
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }

    public put(key: Uint8Array, value: Uint8Array): void;
    public put(key: PowerKvKey, value: PowerKvValue): void;
    public put(key: PowerKvKey | Uint8Array, value: PowerKvValue | Uint8Array): void {
        if (this.isShutdown) {
            throw new PowerKvError('PowerKvCached has been shut down');
        }

        let keyBytes: Uint8Array;
        let valueBytes: Uint8Array;

        // Handle the byte array overload
        if (key instanceof Uint8Array && value instanceof Uint8Array) {
            keyBytes = key;
            valueBytes = value;
        } else {
            // Handle the Object overload
            if (key === null || key === undefined) {
                throw new PowerKvError('Key cannot be null');
            }
            if (value === null || value === undefined) {
                throw new PowerKvError('Value cannot be null');
            }

            keyBytes = this.toBytes(key as PowerKvKey);
            valueBytes = this.toBytes(value as PowerKvValue);
        }
        
        const keyWrapper = new ByteArrayWrapper(keyBytes);
        const keyStr = keyWrapper.toString();
        
        const oldValue = this.cache.get(keyStr);

        // Update cache immediately
        this.cache.set(keyStr, valueBytes);

        // If oldValue is same as new value, no need to update db
        // If oldValue is null/undefined, it means this key is being inserted for the first time, so we need to update db
        if (oldValue === undefined || !this.arraysEqual(oldValue, valueBytes)) {
            // Start background write (non-blocking)
            this.backgroundWrite(keyBytes, valueBytes, keyStr);
        }
    }

    private async backgroundWrite(keyBytes: Uint8Array, valueBytes: Uint8Array, keyStr: string): Promise<void> {
        if (this.isShutdown) return;

        const writeId = `${keyStr}-${Date.now()}`;
        this.activeWrites.add(writeId);

        try {
            // Retry until success or cache is updated with different value
            while (!this.isShutdown) {
                const currentCachedValue = this.cache.get(keyStr);
                
                // If cache is updated with different value, stop this background write
                if (!currentCachedValue || !this.arraysEqual(currentCachedValue, valueBytes)) {
                    console.log(`Cache updated for key, stopping background write: ${new TextDecoder().decode(keyBytes)}`);
                    break;
                }

                try {
                    const success = await this.db.put(keyBytes, valueBytes);
                    if (success) {
                        console.log(`Successfully updated key on PWR Chain: ${new TextDecoder().decode(keyBytes)}`);
                        break;
                    } else {
                        console.warn(`Failed to update key on PWR Chain, retrying: ${new TextDecoder().decode(keyBytes)}`);
                        
                        // Check if another process has already updated the value
                        try {
                            const remoteValue = await this.db.getValue(keyBytes);
                            if (remoteValue && this.arraysEqual(remoteValue, valueBytes)) {
                                console.log(`Value already updated by another process: ${new TextDecoder().decode(keyBytes)}`);
                                break;
                            }
                        } catch (checkErr) {
                            // Ignore errors when checking remote value
                        }
                        
                        // Wait 10ms before retry (like Java version)
                        await new Promise(resolve => setTimeout(resolve, 10));
                    }
                } catch (error) {
                    console.error(`Error updating key on PWR Chain: ${new TextDecoder().decode(keyBytes)}`, error);
                    
                    // Wait 10ms before retry
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }
        } finally {
            this.activeWrites.delete(writeId);
        }
    }

    public getValue(key: Uint8Array): Uint8Array | null;
    public getValue(key: PowerKvKey): Uint8Array | null;
    public getValue(key: PowerKvKey | Uint8Array): Uint8Array | null {
        let keyBytes: Uint8Array;

        // Handle the byte array overload
        if (key instanceof Uint8Array) {
            keyBytes = key;
        } else {
            // Handle the Object overload  
            if (key === null || key === undefined) {
                throw new PowerKvError('Key cannot be null');
            }
            keyBytes = this.toBytes(key);
        }

        const keyWrapper = new ByteArrayWrapper(keyBytes);
        const keyStr = keyWrapper.toString();
        
        // Check cache first
        const cachedValue = this.cache.get(keyStr);
        if (cachedValue !== undefined) {
            return cachedValue;
        }

        // If not in cache, try to fetch from remote synchronously
        // Note: This is a limitation of the sync API in async environment
        try {
            // We can't make this truly synchronous in JavaScript/TypeScript
            // So we return null and expect users to use getValueAsync for remote fetching
            return null;
        } catch (error) {
            console.error('Error retrieving value:', error);
            return null;
        }
    }

    public async getValueAsync(key: PowerKvKey): Promise<Uint8Array | null> {
        const keyBytes = this.toBytes(key);
        const keyWrapper = new ByteArrayWrapper(keyBytes);
        const keyStr = keyWrapper.toString();
        
        // Check cache first
        const cachedValue = this.cache.get(keyStr);
        if (cachedValue !== undefined) {
            return cachedValue;
        }

        // If not in cache, fetch from remote
        try {
            const value = await this.db.getValue(keyBytes);
            if (value) {
                // Cache the retrieved value
                this.cache.set(keyStr, value);
            }
            return value;
        } catch (error) {
            console.error('Error retrieving value:', error);
            return null;
        }
    }

    public getStringValue(key: PowerKvKey): string | null {
        const value = this.getValue(key);
        if (value === null || value === undefined) return null;
        return new TextDecoder().decode(value);
    }

    public async getStringValueAsync(key: PowerKvKey): Promise<string | null> {
        const value = await this.getValueAsync(key);
        if (value === null || value === undefined) return null;
        return new TextDecoder().decode(value);
    }

    public getIntValue(key: PowerKvKey): number | null {
        const value = this.getValue(key);
        if (value === null || value === undefined) return null;
        const str = new TextDecoder().decode(value);
        const parsed = parseInt(str, 10);
        return isNaN(parsed) ? null : parsed;
    }

    public async getIntValueAsync(key: PowerKvKey): Promise<number | null> {
        const value = await this.getValueAsync(key);
        if (value === null || value === undefined) return null;
        const str = new TextDecoder().decode(value);
        const parsed = parseInt(str, 10);
        return isNaN(parsed) ? null : parsed;
    }

    public getLongValue(key: PowerKvKey): number | null {
        const value = this.getValue(key);
        if (value === null || value === undefined) return null;
        const str = new TextDecoder().decode(value);
        const parsed = parseInt(str, 10);
        return isNaN(parsed) ? null : parsed;
    }

    public async getLongValueAsync(key: PowerKvKey): Promise<number | null> {
        const value = await this.getValueAsync(key);
        if (value === null || value === undefined) return null;
        const str = new TextDecoder().decode(value);
        const parsed = parseInt(str, 10);
        return isNaN(parsed) ? null : parsed;
    }

    public getDoubleValue(key: PowerKvKey): number | null {
        const value = this.getValue(key);
        if (value === null || value === undefined) return null;
        const str = new TextDecoder().decode(value);
        const parsed = parseFloat(str);
        return isNaN(parsed) ? null : parsed;
    }

    public async getDoubleValueAsync(key: PowerKvKey): Promise<number | null> {
        const value = await this.getValueAsync(key);
        if (value === null || value === undefined) return null;
        const str = new TextDecoder().decode(value);
        const parsed = parseFloat(str);
        return isNaN(parsed) ? null : parsed;
    }

    public async shutdown(): Promise<void> {
        console.log('Shutting down PowerKvCached...');
        this.isShutdown = true;

        // Wait for all active writes to complete (max 60 seconds like Java version)
        const maxWaitTime = 60000; // 60 seconds
        const startTime = Date.now();
        
        while (this.activeWrites.size > 0 && (Date.now() - startTime) < maxWaitTime) {
            console.log(`Waiting for ${this.activeWrites.size} background writes to complete...`);
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (this.activeWrites.size > 0) {
            console.warn(`Forced shutdown with ${this.activeWrites.size} writes still active`);
        } else {
            console.log('All background writes completed');
        }
    }
}
