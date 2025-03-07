import {
    IvaTransactionSubscription,
    IvaTransactionHandler,
} from '../src/protocol/iva';
import { VmDataTransaction } from '../src/record/vmDataTransaction';
import { PWRJS } from '../src';

describe('IvaTransactionSubscription Unit Test (with mocks)', () => {
    beforeAll(() => {
        jest.useFakeTimers();
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('should process transactions without error and call the handler', async () => {
        // Dummy transaction for the test.
        // mocked
        const txn: VmDataTransaction = {
            size: 0,
            blockNumber: 0,
            positionInTheBlock: 0,
            fee: '',
            type: '',
            sender: '',
            receiver: '',
            nonce: 0,
            hash: '',
            timestamp: 0,
            value: '',
            extraFee: '',
            rawTransaction: '',
            chainId: 0,
            errorMeage: '',
            success: true,
            data: '0x00000159f901568306165f843b9aca00830493e0945683eef63fdd0bb08bb559dd5326a58bcbb4177b01b8eceffeefefefefefefefefefefefefefeff0efefefefefefefefefffefefefefeffeefefefdfeff0efeff5efefefefefefefefefefefefefefefef1fefef4fefefefefefefefefefefefefefefefefefeff9efefefefefeff1eff59fefefefefefacefefefeffbfdefefef74dfefffefefefefefefefefef7feffbefefefefefefefefefefefefefefefefefeff7efeffdffcfefefef7fefefefefffefefefef0ff1efeff4efefefefefcfefefeffaef0fefefefeff7efefbfdfefefefefefefefefefefefefefefefefefefefefefefef9fefefefefefefeffcefefefefefefefefef9fefefefefefefefefef8205a6a03ef60bc779abc2687c3a8d964013038c3d8a8fc640c24272262226d5613954c5a01e28824b8609091eab4e3b708e436318f796abf2cc805f28fe7106153d8d4fa8',
            vmId: '705',
        };

        // Create a PWRJS mock.
        const mockLatestBlock = '1500';
        const mockTransactions: VmDataTransaction[] = [txn];

        const pwrjs: PWRJS = {
            getLatestBlockNumber: jest.fn().mockResolvedValue(mockLatestBlock),
            getVMDataTransactions: jest
                .fn()
                .mockResolvedValue(mockTransactions),
        } as unknown as PWRJS;

        // Create a handler mock to track calls.
        // const processIvaTransactionsMock = jest.fn();
        const handler: IvaTransactionHandler = {
            processIvaTransactions: jest.fn(),
        };

        const vmId = BigInt(705);
        const startingBlock = BigInt(1000);
        const pollInterval = 50; // Fast polling for the unit test.

        const subscription = new IvaTransactionSubscription(
            pwrjs,
            vmId,
            startingBlock,
            handler,
            pollInterval
        );

        // Start the subscription.
        const startPromise = subscription.start();

        // Advance timers to let one poll cycle execute.
        jest.advanceTimersByTime(pollInterval * 2);

        // Let pending promises resolve.
        await Promise.resolve();

        // Stop the subscription.
        subscription.stop();

        // Advance time to allow the loop to exit gracefully.
        await jest.advanceTimersByTimeAsync(pollInterval);

        // Await the subscription loop termination.
        await startPromise;

        // Verify that the mocks were called.
        expect(pwrjs.getLatestBlockNumber).toHaveBeenCalled();
        expect(pwrjs.getVMDataTransactions).toHaveBeenCalled();
        expect(handler.processIvaTransactions).toHaveBeenCalledWith(txn);
    });
});
