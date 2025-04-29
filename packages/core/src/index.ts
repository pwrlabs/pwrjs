// core
import Falcon512Wallet from './wallet/falcon-512-wallet';
import PWRJS from './protocol/pwrjs';

// export services
import DeterministicSecureRandom from './services/secure-random.service';

const services = {
    DeterministicSecureRandom,
};

// todo: split into separate files add package.json for each module
export { Falcon512Wallet, PWRJS };
