declare global {
    interface PWR {
        connect: () => Promise<any>;
        getConnections: () => Promise<any>;
        disconnect: (data: object) => Promise<any>;
    }

    interface Window {
        pwr?: PWR;
    }
}

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

        if (!(account.length)) {
            console.error("Connect your wallet first.");
            return false;
        } else {
            return true;
        }
    }
}

export async function connect() {
    if (isInstalled()) {
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
