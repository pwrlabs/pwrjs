// core
import Falcon512Wallet from './wallet/falcon-512-wallet';
import PWRJS from './protocol/pwrjs';

// additional tools
import TransactionDecoder from './protocol/transaction-decoder';
import FalconTransactionBuilder from './protocol/falcon-transaction-builder';

// export services
import DeterministicSecureRandom from './services/secure-random.service';

const services = {
    DeterministicSecureRandom,
};

// todo: split into separate files add package.json for each module
export {
    Falcon512Wallet,
    PWRJS,
    TransactionDecoder,
    FalconTransactionBuilder as TransactionBuilder,
    services,
};
