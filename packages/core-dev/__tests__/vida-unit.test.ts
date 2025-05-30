import { test, describe, beforeAll, afterAll, expect, vi } from 'vitest';
import { VidaTransactionSubscription, ProcessVidaTransactions } from '../src/protocol/vida';
import { VidaDataTransaction } from '../src/record/vidaDataTransaction';
import { PWRJS } from '../src';

describe('VidaTransactionSubscription Unit Test (with mocks)', () => {
    beforeAll(() => {
        vi.useFakeTimers();
    });

    afterAll(() => {
        vi.useRealTimers();
    });

    test('should process transactions without error and call the handler', async () => {
        // Dummy transaction for the test.
        // mocked
        const txn: VidaDataTransaction = {
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
            vidaId: '705',
        };

        // Create a PWRJS mock.
        const mockLatestBlock = '1500';
        const mockTransactions: VidaDataTransaction[] = [txn];

        const pwrjs: PWRJS = {
            getLatestBlockNumber: vi.fn().mockResolvedValue(mockLatestBlock),
            getVMDataTransactions: vi.fn().mockResolvedValue(mockTransactions),
        } as unknown as PWRJS;

        // Create a handler mock to track calls.
        // const processIvaTransactionsMock = jest.fn();
        const handler: ProcessVidaTransactions = vi.fn();

        const vidaId = BigInt(705);
        const startingBlock = BigInt(1000);
        const pollInterval = 50; // Fast polling for the unit test.

        const subscription = new VidaTransactionSubscription(
            pwrjs,
            vidaId,
            startingBlock,
            handler,
            pollInterval
        );

        // Start the subscription.
        const startPromise = subscription.start();

        // Advance timers to let one poll cycle execute.
        vi.advanceTimersByTime(pollInterval * 2);

        // Let pending promises resolve.
        await Promise.resolve();

        // Stop the subscription.
        subscription.stop();

        // Advance time to allow the loop to exit gracefully.
        await vi.advanceTimersByTimeAsync(pollInterval);

        // Await the subscription loop termination.
        await startPromise;

        // Verify that the mocks were called.
        expect(pwrjs.getLatestBlockNumber).toHaveBeenCalled();
        expect(pwrjs.getVidaDataTransactions).toHaveBeenCalled();
        expect(handler).toHaveBeenCalledWith(txn);
    });
});
