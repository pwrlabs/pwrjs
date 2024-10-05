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

type AccountChangeCallback = (accounts: string[]) => void;
type ConnectCallback = (address: string) => void;
type DisconnectCallback = () => void;

export function isInstalled() {
    if (typeof window.pwr === 'undefined') {
        console.error("PWR Chain Wallet is not installed!");
        return false;
    } else {
        return true;
    }
}

export async function isConnected(): Promise<boolean> {
    if (isInstalled()) {
        const account = await window.pwr.getConnections()

        if (account.length) {
            return true;
        }
    }
    return false;
}

export async function getConnection(): Promise<string> {
    if (await isConnected()) {
        const account = await window.pwr.getConnections();

        if (account.length) {
            return account[0];
        }
    }
    return "";
}

export async function connect() {
    if (isInstalled() && !(await isConnected())) {
        try {
            await window.pwr.connect();
        } catch (error) {
            console.error('Failed to connect to PWR Chain Wallet:', error);
        }
    }
}

export async function disconnect() {
    if ((await isConnected())) {
        const account = await window.pwr.getConnections();

        try {
            await window.pwr.disconnect({ address: account[0] });
        } catch (error) {
            console.error('Failed to disconnect PWR Chain Wallet:', error);
        }
    }
}

export async function getEvent(
    eventName: "onAccountChange" | "onConnect" | "onDisconnect", 
    callback: AccountChangeCallback | ConnectCallback | DisconnectCallback
): Promise<void> {
    if (eventName == "onAccountChange") {
        window.pwr.onAccountChange.addListener(callback as AccountChangeCallback);
    }
    else if (eventName == "onConnect") {
        window.pwr.onConnect.addListener(callback as ConnectCallback);
    }
    else if (eventName == "onDisconnect") {
        window.pwr.onDisconnect.addListener(callback as DisconnectCallback);
    } else {
        console.error(`There is no event named ${eventName}`);
    }
}
