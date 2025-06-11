import BrowserWallet from './wallet/browserWallet';

import { connect, disconnect, isInstalled, getConnection, getEvent } from './wallet/connection';

if (typeof window === 'undefined') {
    throw new Error('BrowserWallet can only be used in a browser environment.');
}

export {
    BrowserWallet,
    connect,
    disconnect,
    isInstalled,
    getConnection,
    getEvent,
}
