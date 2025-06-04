import BrowserWallet from './wallet/browserWallet';

import { TransactionTypes } from './types/transaction.types';

import { connect, disconnect, isInstalled, getConnection, getEvent } from './wallet/connection';

export { BrowserWallet, connect, disconnect, isInstalled, getConnection, getEvent };

if (typeof window === 'undefined') {
    throw new Error('BrowserWallet can only be used in a browser environment.');
}
