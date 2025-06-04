import { PwrI } from '../types';

// Declaring global PWR interface for wallet interaction
declare global {
    interface Window {
        pwr?: PwrI;
    }
}

// Type definitions for callback handlers
type AccountChangeCallback = (accounts: string[]) => void;
type ConnectCallback = (address: string[]) => void;
type DisconnectCallback = () => void;

// Utility function to check if PWR is installed
export function isInstalled() {
    if (!window.pwr) {
        console.error('PWR Chain Wallet is not installed!');
        return false;
    }
    return true;
}

// Function to check if the wallet is connected
export async function isConnected(): Promise<boolean> {
    if (isInstalled()) {
        const accounts = await window.pwr.getConnections();
        return accounts.length > 0;
    }
    return false;
}

// Get the current connected account
export async function getConnection(): Promise<string | null> {
    if (await isConnected()) {
        const accounts = await window.pwr.getConnections();
        return accounts[0];
    }
    return null;
}

// Function to initiate wallet connection
export async function connect() {
    if (isInstalled() && !(await isConnected())) {
        try {
            await window.pwr.connect();
        } catch (error) {
            console.error('Failed to connect to PWR Chain Wallet:', error);
        }
    }
}

// Function to disconnect the wallet
export async function disconnect() {
    if (await isConnected()) {
        const address = await getConnection();
        try {
            await window.pwr.disconnect({ address });
        } catch (error) {
            console.error('Failed to disconnect PWR Chain Wallet:', error);
        }
    }
}

// Register event listener for account change, connect, or disconnect
export async function getEvent(
    eventName: 'onAccountChange' | 'onConnect' | 'onDisconnect',
    callback: AccountChangeCallback | ConnectCallback | DisconnectCallback
): Promise<void> {
    switch (eventName) {
        case 'onAccountChange':
            window.pwr.onAccountChange.addListener(callback as AccountChangeCallback);
            break;
        case 'onConnect':
            window.pwr.onConnect.addListener(callback as ConnectCallback);
            break;
        case 'onDisconnect':
            window.pwr.onDisconnect.addListener(callback as DisconnectCallback);
            break;
        default:
            console.error(`No event named ${eventName}`);
    }
}
