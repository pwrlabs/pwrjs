import {
    IvaTransactionSubscription,
    IvaTransactionHandler,
} from '../src/protocol/iva';
import { VmDataTransaction } from '../src/record/vmDataTransaction';
import { PWRJS } from '../src';

describe('IvaTransactionSubscription Integration Test (Real Objects)', () => {
    // Increase timeout if needed because this test hits the real endpoint.
    jest.setTimeout(10000);

    it('should run one poll cycle without errors and then stop', async () => {
        const rpc = 'https://pwrrpc.pwrlabs.io';
        const pwrjs: PWRJS = new PWRJS(rpc);

        // Real handler that logs the transaction.
        const handler: IvaTransactionHandler = {
            processIvaTransactions(transaction: VmDataTransaction): void {
                // console.log('--------- txn ---------');
                // console.log(transaction);
            },
        };

        const vmId = BigInt(705);
        const startingBlock = BigInt(460100);
        const pollInterval = 200; // short interval for testing

        // Create the subscription.
        const subscription = new IvaTransactionSubscription(
            pwrjs,
            vmId,
            startingBlock,
            handler,
            pollInterval
        );

        // Start the subscription.
        const startPromise = subscription.start();

        // Wait long enough for one poll cycle.
        await new Promise((resolve) => setTimeout(resolve, pollInterval * 2));

        // Stop the subscription.
        subscription.stop();

        // Await the termination of the polling loop.
        await startPromise;

        // Test passes if no errors were thrown.
        expect(true).toBe(true);
    });
});
