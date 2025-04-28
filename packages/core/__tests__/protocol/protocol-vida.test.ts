import { describe, test, expect } from 'vitest';

import PWRJS from '../../src/protocol/pwrjs';

function sleep(timeMs: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeMs);
    });
}

describe('pwrjs core general', () => {
    const url = 'http://46.101.151.203:8085';

    const testAddress = '0xffb927e3e1fd43fc47bd140c817af780241d1b31';
    const vidaAddress = '0x1000000000000000000000000000000000010023';

    const pwrjs = new PWRJS(url);

    function checkBaseValidator(validator: any) {
        expect(validator).toHaveProperty('address');
        expect(validator).toHaveProperty('ip');
        expect(validator).toHaveProperty('votingPower');
        expect(validator).toHaveProperty('totalShares');
        expect(validator).toHaveProperty('delegatorsCount');
        expect(validator).toHaveProperty('status');
    }

    // #region vida

    test('vida owner txn fee ', async () => {
        const vmOwnerTxnFee = await pwrjs.getVidaOwnerTransactionFeeShare();
        expect(vmOwnerTxnFee).toBeGreaterThan(0);
    });

    test('vida claiming fee', async () => {
        const claimingFee = await pwrjs.getVidaIdClaimingFee();
        expect(claimingFee).toBe(100000000000);
    });

    test('vida id address', async () => {
        const vmId = pwrjs.getVidaIdAddress(BigInt(10023));

        expect(vmId).toBe(vidaAddress);
    });

    test('is vida address', async () => {
        const notVmAddress = PWRJS.isVidaAddress(testAddress);
        const _vmAddress = PWRJS.isVidaAddress(vidaAddress);
        const _vmAddress2 = PWRJS.isVidaAddress('0x0000000000000000000007075656276978097000');
        const _vmAddress3 = PWRJS.isVidaAddress('0x1000000000000000000007075656276978097000');

        expect(notVmAddress).toBe(false);
        expect(_vmAddress).toBe(true);
        expect(_vmAddress2).toBe(true);
        expect(_vmAddress3).toBe(true);
    });

    // test('PWRJS VMDataTxn', async () => {
    //     const vmDataTxn = await pwrjs.getVMDataTransactions(
    //         '1000',
    //         '1002',
    //         '10023'
    //     );

    //     const TxnData = {
    //         receiver: '10023',
    //         data: '0x0000014ff9014c82064b843b9aca0082801f94119e7769552157edfc425c4d0667f3c6f56225a280b8e4f7742d2f00000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000008dc7e4a9bc0a0a00000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000012c00000000000000000000000000000000000000000000000000000000000000183636353437666630333031393337386639313636323235640000000000000000824e71a0aaeca5c433f69f487d84cd423da6ed0df53a69a648795faddf543b5022fdfe75a044530d65c3d1eb00b16178df495557eea4710088de444d6a945c062be9b66d34',
    //         vmId: 10023,
    //         fee: 51800,
    //         errorMessage: '',
    //         type: 'VM Data',
    //         nonce: 1044,
    //         positionInTheBlock: 2,
    //         rawTransaction: '',
    //         size: 418,
    //         sender: '0x3AD98F914C9233137959D142B93FE71563A21F25',
    //         chainId: 0,
    //         success: true,
    //         blockNumber: 1002,
    //         value: 0,
    //         extraFee: 0,
    //         hash: '0x1367a5a3c3123603f5baf227ad7046f3ddcd6e99423c0d70fe65b051f847a32d',
    //         timestamp: 1716813810,
    //     };

    //     expect(vmDataTxn[0]).toEqual(TxnData);
    // });

    test('Owner of vida', async () => {
        const res = await pwrjs.getOwnerOfVida(456n);

        expect(res?.toLowerCase()).toBe('0xe68191b7913e72e6f1759531fbfaa089ff02308a');
    });

    // test('conduits of VM', async () => {
    //     const conduits = await pwrjs.getConduitsOfVm('111');

    //     expect(conduits.length).toBeGreaterThan(0);
    // });

    // #endregion
});
