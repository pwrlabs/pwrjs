import PWRWallet from './wallet/wallet';
import Falcon512Wallet from './wallet/falcon-512-wallet';
import PWRJS from './protocol/pwrjs';

import { connect, disconnect, isInstalled, getConnection, getEvent } from './wallet/connection';

import TransactionDecoder from './protocol/transaction-decoder';
import TransactionBuilder from './protocol/transaction-builder';

// todo: split into separate files
export { 
    PWRWallet,
    Falcon512Wallet,
    PWRJS,
    connect,
    disconnect,
    isInstalled,
    getConnection,
    getEvent,
    TransactionDecoder,
    TransactionBuilder
};
