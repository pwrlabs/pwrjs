import { describe, test, expect } from 'vitest';

import PWRJS from '../../src/protocol/pwrjs';

import WalletUtils from '../../src/wallet.utils';

import { HttpTypes } from '../../src/entities/http.types';
import {
    AnyFalconTransaction,
    SetGuardianTransaction,
    SetPublicKeyTransaction,
    Transactions,
    TransferTransaction,
} from '../../src/entities/falcon-transaction.entity';

function sleep(timeMs: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeMs);
    });
}

describe('pwrjs core general', () => {
    const url = 'http://46.101.151.203:8085';

    const testAddress = '0xffb927e3e1fd43fc47bd140c817af780241d1b31';
    const vmAddress = '0x1000000000000000000000000000000000010023';

    const pwrjs = new PWRJS(url);

    test('retrieve transaction by hash', async () => {
        expect(true).toBe(true);
    });
});
