import { ConnectionTypes } from "./wallet.types";

// Declaring global PWR interface for wallet interaction
declare global {
    interface PWR {
        // data
        name: string;
        version: string;
        // actions
        restablishConnection: () => Promise<string>;
        connect: () => Promise<any>;
        disconnect: (data: object) => Promise<any>;
        getConnections: () => Promise<any>;
        areAutomatedTransactionsEnabled: () => Promise<any>;
        getFingerprints: () => Promise<any>;
        // transactions
        transferPwr: (txnData: object) => Promise<string>;
        dataTransaction: (txnData: object) => Promise<string>;
        bytesDataTransaction: (txnData: object) => Promise<string>;
        payableVmDataTransaction: (txnData: object) => Promise<string>;
        claimIdVm: (txnData: object) => Promise<string>;
        delegate: (txnData: object) => Promise<string>;
        withdraw: (txnData: object) => Promise<string>;
        moveStake: (txnData: object) => Promise<string>;
        earlyWithdrawPenalty: (txnData: object) => Promise<string>;
        feePerByte: (txnData: object) => Promise<string>;
        otherProposal: (txnData: object) => Promise<string>;
        overallBurnPercentage: (txnData: object) => Promise<string>;
        rewardPerYear: (txnData: object) => Promise<string>;
        validatorCountLimit: (txnData: object) => Promise<string>;
        validatorJoiningFee: (txnData: object) => Promise<string>;
        vmIdClaimingFee: (txnData: object) => Promise<string>;
        vmOwnerTransactionFeeShare: (txnData: object) => Promise<string>;
        voteOnProposal: (txnData: object) => Promise<string>;
        maxBlockSize: (txnData: object) => Promise<string>;
        maxTransactionSize: (txnData: object) => Promise<string>;
        // events
        onAccountChange: {
			addListener: (callback: (accounts: string[]) => void) => void;
		};
        onConnect: {
            addListener: (callback: (address: string) => void) => void;
        };
        onDisconnect: {
			addListener: (callback: () => void) => void;
		};
    }

    interface Window {
        pwr?: PWR;
    }
}

// Type definitions for callback handlers
type AccountChangeCallback = (accounts: string[]) => void;
type ConnectCallback = (address: string) => void;
type DisconnectCallback = () => void;

// Utility function to check if PWR is installed
export function isInstalled() {
    if (!window.pwr) {
        console.error("PWR Chain Wallet is not installed!");
        return false;
    }
    return true;
}

// Function to check if the wallet is connected
export async function isConnected(): Promise<boolean> {
    if (isInstalled()) {
        const accounts = await window.pwr.getConnections()
        return accounts.length > 0;
    }
    return false;
}

// Get the current connected account
export async function getConnection(): Promise<ConnectionTypes> {
    if (await isConnected()) {
        const accounts = await window.pwr.getConnections();
        return {
            id: accounts[0].id,
            name: accounts[0].name,
            publicKey: accounts[0].publicKey,
            privateKey: accounts[0].privateKey,
            address: accounts[0].address,
        };
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
        const address = (await getConnection()).address;
        try {
            await window.pwr.disconnect({ address: address });
        } catch (error) {
            console.error('Failed to disconnect PWR Chain Wallet:', error);
        }
    }
}

// Register event listener for account change, connect, or disconnect
export async function getEvent(
    eventName: "onAccountChange" | "onConnect" | "onDisconnect", 
    callback: AccountChangeCallback | ConnectCallback | DisconnectCallback
): Promise<void> {
    switch (eventName) {
        case "onAccountChange":
            window.pwr.onAccountChange.addListener(callback as AccountChangeCallback);
            break;
        case "onConnect":
            window.pwr.onConnect.addListener(callback as ConnectCallback);
            break;
        case "onDisconnect":
            window.pwr.onDisconnect.addListener(callback as DisconnectCallback);
            break;
        default:
            console.error(`No event named ${eventName}`);
    }
}
