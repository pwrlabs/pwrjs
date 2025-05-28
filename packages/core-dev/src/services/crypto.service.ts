/**
 * Wrapper class for basic cryptographic operations.
 * This class provides static encryption and decryption methods for private keys.
 */
export default class CryptoService {
    /**
     * Browser implementation using Web Crypto API.
     * Encrypts bytes (Uint8Array) using AES-GCM with a key derived via PBKDF2.
     *
     * @param {data} Uint8Array - The byte array.
     * @param {string} password - The password used for key derivation.
     * @returns {Promise<Uint8Array>} A promise that resolves to the encrypted data.
     */
    static async encryptBrowser(
        data: Uint8Array,
        password: string
    ): Promise<Uint8Array> {
        // Implementation
        const passwordBytes = new TextEncoder().encode(password);

        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12)); // Recommended 12-byte IV for AES-GCM

        // Import the password as key material.
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            passwordBytes,
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        const derivedKey = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                hash: 'SHA-256',
                salt: salt,
                iterations: 100000,
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt']
        );

        const encryptedBuffer = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            derivedKey,
            new Uint8Array(data)
        );

        // Combine salt + iv + ciphertext for storage/transport.
        const encryptedBytes = new Uint8Array(
            salt.byteLength + iv.byteLength + encryptedBuffer.byteLength
        );
        encryptedBytes.set(salt, 0);
        encryptedBytes.set(iv, salt.byteLength);
        encryptedBytes.set(
            new Uint8Array(encryptedBuffer),
            salt.byteLength + iv.byteLength
        );

        return encryptedBytes;
    }

    /**
     * Node.js implementation using Node's crypto module.
     * Encrypts data (Buffer or Uint8Array) using AES-256-GCM with a key derived via PBKDF2.
     *
     * @param {Uint8Array} data - The data as a byte array.
     * @param {string} password - The password used for key derivation.
     * @returns {Uint8Array} The encrypted data.
     */
    static encryptNode(data: Uint8Array, password: string): Uint8Array {
        const crypto = require('crypto') as typeof import('crypto');

        // Generate random salt and IV.
        const salt = crypto.randomBytes(16);
        const iv = crypto.randomBytes(12);

        // Derive a 32-byte key using PBKDF2.
        const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

        // Create cipher.
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
        const authTag = cipher.getAuthTag();

        // Combine salt + iv + authTag + ciphertext.
        return Buffer.concat([salt, iv, authTag, encrypted]);
    }

    /**
     * Browser decryption implementation using the Web Crypto API.
     * Assumes the input is formatted as: salt (16 bytes) | iv (12 bytes) | ciphertext (includes auth tag).
     *
     * @param {Uint8Array} data - The encrypted data.
     * @param {string} password - The password used for key derivation.
     * @returns {Promise<Uint8Array>} A promise resolving to the decrypted private key bytes.
     */
    static async decryptPrivateKeyBrowser(
        encryptedBytes: Uint8Array,
        password: string
    ): Promise<Uint8Array> {
        const encoder = new TextEncoder();

        // Extract salt and iv from the encrypted data.
        const salt = encryptedBytes.slice(0, 16);
        const iv = encryptedBytes.slice(16, 28);
        const ciphertext = encryptedBytes.slice(28);

        // Import the password as key material.
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        // Derive the AES-GCM key.
        const key = await window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256',
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );

        // Decrypt the ciphertext.
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            ciphertext
        );

        return new Uint8Array(decryptedBuffer);
    }

    /**
     * Node.js decryption implementation using the built-in crypto module.
     * Assumes the input is formatted as: salt (16 bytes) | iv (12 bytes) | authTag (16 bytes) | ciphertext.
     *
     * @param {Uint8Array|Buffer} encryptedBytes - The encrypted data.
     * @param {string} password - The password used for key derivation.
     * @returns {Uint8Array} The decrypted private key bytes.
     */
    static decryptNode(
        encryptedBytes: Uint8Array,
        password: string
    ): Uint8Array {
        const crypto = require('crypto') as typeof import('crypto');

        // Extract the parts.
        const salt = encryptedBytes.slice(0, 16);
        const iv = encryptedBytes.slice(16, 28);
        const authTag = encryptedBytes.slice(28, 44);
        const ciphertext = encryptedBytes.slice(44);

        // Derive the key.
        const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

        // Create a decipher and set the authentication tag.
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);

        // Decrypt the data.
        const decrypted = Buffer.concat([
            decipher.update(ciphertext),
            decipher.final(),
        ]);
        return new Uint8Array(decrypted);
    }
}
