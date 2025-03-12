/**
 *
 * @export
 * @class StorageService
 * @description
 * StorageService is a service that provides methods to export and import data.
 *
 */
export default class StorageService {
    /**
     * download the data bytes as a .dat file.
     * @param data - the byte array.
     * @returns
     */
    static saveBrowser(data: Uint8Array): void {
        // Create a Blob from the bytes data.
        const blob = new Blob([data], {
            type: 'application/octet-stream',
        });

        // Create a temporary URL for the Blob.
        const url = window.URL.createObjectURL(blob);

        // Create an invisible anchor element and trigger the download.
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wallet.dat'; // Specify the file name.
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    /**
     * Save the data bytes as a .dat file in Node.js environment.
     * @param data - The byte array.
     * @param filePath - The path where the file will be saved.
     */
    static saveNode(data: Uint8Array, filePath: string): void {
        if (!filePath)
            throw new Error('filePath is required in Node.js environment');

        // Import the Node.js file system module.
        const fs = require('fs') as typeof import('fs');
        const path = require('path') as typeof import('path');

        // Define the path where you want to save the wallet.
        const name = 'wallet.dat';

        const _p = path.join(filePath, name);
        // Write the encrypted data to the file.
        fs.writeFileSync(_p, data);
    }

    /**
     * Load the data bytes from a .dat file in the browser.
     * @param file - The file to load.
     * @returns The data as a byte array.
     * @throws An error if the file cannot be loaded.
     *
     */
    static loadBrowser(file: File): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (event) => {
                const data = new Uint8Array(event.target.result as ArrayBuffer);
                resolve(data);
            };

            reader.onerror = (error) => {
                reject(error);
            };

            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Load the data bytes from a .dat file in Node.js environment.
     * @param filePath - The path to the file.
     * @returns The data as a byte array.
     */
    static loadNode(filePath: string): Uint8Array {
        if (!filePath)
            throw new Error('filePath is required in Node.js environment');

        // Import the Node.js file system module.
        const fs = require('fs') as typeof import('fs');
        const path = require('path') as typeof import('path');

        // Define the path where you want to save the wallet.
        const name = 'wallet.dat';
        const _p = path.join(filePath, name);

        // Read the encrypted data from the file.
        return fs.readFileSync(_p);
    }
}
