import { test, describe, beforeAll, afterAll, expect, vi } from 'vitest';
import { VidaTransactionSubscription, ProcessVidaTransactions, BlockSaver } from '../src/protocol/vida';
import { VidaDataTransaction } from '../src/record/vidaDataTransaction';
import PWRJS from '../src/protocol/pwrjs';

describe('VidaTransactionSubscription Unit Test (with mocks)', () => {
    beforeAll(() => {
        vi.useFakeTimers();
    });

    afterAll(() => {
        vi.useRealTimers();
    });

    // Helper function to create a mock transaction
    const createMockTransaction = (hash: string = 'test-hash'): VidaDataTransaction => ({
        size: 0,
        blockNumber: 0,
        positionInTheBlock: 0,
        fee: '',
        type: '',
        sender: '',
        receiver: '',
        nonce: 0,
        hash,
        timestamp: 0,
        value: '',
        extraFee: '',
        rawTransaction: '',
        chainId: 0,
        errorMeage: '',
        success: true,
        data: '0x00000159f901568306165f843b9aca00830493e0945683eef63fdd0bb08bb559dd5326a58bcbb4177b01b8eceffeefefefefefefefefefefefefefeff0efefefefefefefefefffefefefefeffeefefefdfeff0efeff5efefefefefefefefefefefefefefefef1fefef4fefefefefefefefefefefefefefefefefefeff9efefefefefeff1eff59fefefefefefacefefefeffbfdefefef74dfefffefefefefefefefefef7feffbefefefefefefefefefefefefefefefefefeff7efeffdffcfefefef7fefefefefffefefefef0ff1efeff4efefefefefcfefefeffaef0fefefefeff7efefbfdfefefefefefefefefefefefefefefefefefefefefefefef9fefefefefefefeffcefefefefefefefefef9fefefefefefefefefef8205a6a03ef60bc779abc2687c3a8d964013038c3d8a8fc640c24272262226d5613954c5a01e28824b8609091eab4e3b708e436318f796abf2cc805f28fe7106153d8d4fa8',
        vidaId: '705',
    });

    // Helper function to create a mock PWRJS instance
    const createMockPWRJS = (latestBlock: string, transactions: VidaDataTransaction[] = []): PWRJS => ({
        getLatestBlockNumber: vi.fn().mockResolvedValue(latestBlock),
        getVidaDataTransactions: vi.fn().mockResolvedValue(transactions),
    } as unknown as PWRJS);

    test('should process transactions without error and call the handler', async () => {
        const txn = createMockTransaction();
        const pwrjs = createMockPWRJS('1500', [txn]);
        const handler: ProcessVidaTransactions = vi.fn();

        const vidaId = BigInt(705);
        const startingBlock = BigInt(1000);
        const pollInterval = 50;

        const subscription = new VidaTransactionSubscription(
            pwrjs,
            vidaId,
            startingBlock,
            handler,
            pollInterval
        );

        const startPromise = subscription.start();
        vi.advanceTimersByTime(pollInterval * 2);
        await Promise.resolve();
        await subscription.stop();
        await vi.advanceTimersByTimeAsync(pollInterval);
        await startPromise;

        expect(pwrjs.getLatestBlockNumber).toHaveBeenCalled();
        expect(pwrjs.getVidaDataTransactions).toHaveBeenCalled();
        expect(handler).toHaveBeenCalledWith(txn);
    });

    test('should save blocks when blockSaver is provided', async () => {
        const txn = createMockTransaction();
        const pwrjs = createMockPWRJS('1500', [txn]);
        const handler: ProcessVidaTransactions = vi.fn();
        const blockSaver: BlockSaver = vi.fn().mockResolvedValue(undefined);

        const subscription = new VidaTransactionSubscription(
            pwrjs,
            BigInt(705),
            BigInt(1000),
            handler,
            50,
            blockSaver
        );

        const startPromise = subscription.start();
        vi.advanceTimersByTime(100);
        await Promise.resolve();
        await subscription.stop();
        await vi.advanceTimersByTimeAsync(50);
        await startPromise;

        expect(blockSaver).toHaveBeenCalled();
        expect(blockSaver).toHaveBeenCalledWith(BigInt(1500));
    });

    test('should handle blockSaver errors gracefully', async () => {
        const txn = createMockTransaction();
        const pwrjs = createMockPWRJS('1500', [txn]);
        const handler: ProcessVidaTransactions = vi.fn();
        const blockSaver: BlockSaver = vi.fn().mockRejectedValue(new Error('Save failed'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const subscription = new VidaTransactionSubscription(
            pwrjs,
            BigInt(705),
            BigInt(1000),
            handler,
            50,
            blockSaver
        );

        const startPromise = subscription.start();
        vi.advanceTimersByTime(100);
        await Promise.resolve();
        await subscription.stop();
        await vi.advanceTimersByTimeAsync(50);
        await startPromise;

        expect(blockSaver).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to save latest checked block'));
        consoleSpy.mockRestore();
    });

    test('should implement proper pause/resume logic with waiting', async () => {
        const pwrjs = createMockPWRJS('1500', []);
        const handler: ProcessVidaTransactions = vi.fn();

        const subscription = new VidaTransactionSubscription(
            pwrjs,
            BigInt(705),
            BigInt(1000),
            handler,
            50
        );

        const startPromise = subscription.start();
        
        // Let it start
        vi.advanceTimersByTime(25);
        await Promise.resolve();
        
        expect(subscription.isRunning()).toBe(true);
        expect(subscription.isPaused()).toBe(false);

        // Pause the subscription
        const pausePromise = subscription.pause();
        vi.advanceTimersByTime(25);
        await Promise.resolve();
        await pausePromise;

        expect(subscription.isPaused()).toBe(true);

        // Resume the subscription
        subscription.resume();
        expect(subscription.isPaused()).toBe(false);

        await subscription.stop();
        await vi.advanceTimersByTimeAsync(50);
        await startPromise;
    });

    test('should handle transaction processing errors individually', async () => {
        const txn1 = createMockTransaction('hash1');
        const txn2 = createMockTransaction('hash2');
        const pwrjs = createMockPWRJS('1500', [txn1, txn2]);
        const handler: ProcessVidaTransactions = vi.fn()
            .mockImplementationOnce(() => { throw new Error('Handler error'); })
            .mockImplementationOnce(() => {}); // Second call succeeds
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const subscription = new VidaTransactionSubscription(
            pwrjs,
            BigInt(705),
            BigInt(1000),
            handler,
            50
        );

        const startPromise = subscription.start();
        vi.advanceTimersByTime(100);
        await Promise.resolve();
        await subscription.stop();
        await vi.advanceTimersByTimeAsync(50);
        await startPromise;

        expect(handler).toHaveBeenCalledTimes(2);
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to process VIDA transaction: hash1'));
        consoleSpy.mockRestore();
    });

    test('should continue processing after network errors', async () => {
        const pwrjs = {
            getLatestBlockNumber: vi.fn().mockResolvedValue('1500'),
            getVidaDataTransactions: vi.fn()
                .mockRejectedValueOnce(new TypeError('fetch failed'))
                .mockResolvedValueOnce([])
        } as unknown as PWRJS;
        
        const handler: ProcessVidaTransactions = vi.fn();
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const subscription = new VidaTransactionSubscription(
            pwrjs,
            BigInt(705),
            BigInt(1000),
            handler,
            50
        );

        const startPromise = subscription.start();
        vi.advanceTimersByTime(150); // Allow multiple cycles
        await Promise.resolve();
        await subscription.stop();
        await vi.advanceTimersByTimeAsync(50);
        await startPromise;

        expect(pwrjs.getVidaDataTransactions).toHaveBeenCalledTimes(2);
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Network error fetching VIDA transactions'));
        consoleSpy.mockRestore();
    });

    test('should set and get latestCheckedBlock correctly', () => {
        const pwrjs = createMockPWRJS('1500');
        const handler: ProcessVidaTransactions = vi.fn();

        const subscription = new VidaTransactionSubscription(
            pwrjs,
            BigInt(705),
            BigInt(1000),
            handler,
            50
        );

        expect(subscription.getLatestCheckedBlock()).toBe(BigInt(1000));

        subscription.setLatestCheckedBlock(BigInt(2000));
        expect(subscription.getLatestCheckedBlock()).toBe(BigInt(2000));
    });

    test('should initialize latestCheckedBlock to startingBlock - 1 on start', async () => {
        const pwrjs = createMockPWRJS('999'); // Less than starting block to avoid processing
        const handler: ProcessVidaTransactions = vi.fn();

        const subscription = new VidaTransactionSubscription(
            pwrjs,
            BigInt(705),
            BigInt(1000),
            handler,
            50
        );

        expect(subscription.getLatestCheckedBlock()).toBe(BigInt(1000));

        const startPromise = subscription.start();
        vi.advanceTimersByTime(25);
        await Promise.resolve();

        expect(subscription.getLatestCheckedBlock()).toBe(BigInt(999)); // startingBlock - 1

        await subscription.stop();
        await vi.advanceTimersByTimeAsync(50);
        await startPromise;
    });

    test('should skip processing when no new blocks are available', async () => {
        const pwrjs = createMockPWRJS('999'); // Less than starting block
        const handler: ProcessVidaTransactions = vi.fn();

        const subscription = new VidaTransactionSubscription(
            pwrjs,
            BigInt(705),
            BigInt(1000),
            handler,
            50
        );

        const startPromise = subscription.start();
        vi.advanceTimersByTime(100);
        await Promise.resolve();
        await subscription.stop();
        await vi.advanceTimersByTimeAsync(50);
        await startPromise;

        expect(pwrjs.getLatestBlockNumber).toHaveBeenCalled();
        expect(pwrjs.getVidaDataTransactions).not.toHaveBeenCalled();
        expect(handler).not.toHaveBeenCalled();
    });

    test('should respect 1000 block batch limit', async () => {
        const pwrjs = createMockPWRJS('3000', []); // Much higher than starting block
        const handler: ProcessVidaTransactions = vi.fn();

        const subscription = new VidaTransactionSubscription(
            pwrjs,
            BigInt(705),
            BigInt(1000),
            handler,
            50
        );

        const startPromise = subscription.start();
        vi.advanceTimersByTime(100);
        await Promise.resolve();
        await subscription.stop();
        await vi.advanceTimersByTimeAsync(50);
        await startPromise;

        expect(pwrjs.getVidaDataTransactions).toHaveBeenCalledWith(
            '1000', // startingBlock - 1 + 1
            '1999', // startingBlock - 1 + 1000
            BigInt(705)
        );
    });

    test('should wait for main loop to finish on stop', async () => {
        const pwrjs = createMockPWRJS('1500', []);
        const handler: ProcessVidaTransactions = vi.fn();
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        const subscription = new VidaTransactionSubscription(
            pwrjs,
            BigInt(705),
            BigInt(1000),
            handler,
            50
        );

        const startPromise = subscription.start();
        vi.advanceTimersByTime(25);
        await Promise.resolve();

        expect(subscription.isRunning()).toBe(true);

        const stopPromise = subscription.stop();
        vi.advanceTimersByTime(25);
        await Promise.resolve();
        await vi.advanceTimersByTimeAsync(50);
        await stopPromise;
        await startPromise;

        expect(subscription.isRunning()).toBe(false);
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Stopping VidaTransactionSubscription for VIDA-ID: 705'));
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('VidaTransactionSubscription for VIDA-ID: 705 has been stopped'));
        consoleSpy.mockRestore();
    });

    test('should not start if already running', async () => {
        const pwrjs = createMockPWRJS('1500', []);
        const handler: ProcessVidaTransactions = vi.fn();
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const subscription = new VidaTransactionSubscription(
            pwrjs,
            BigInt(705),
            BigInt(1000),
            handler,
            50
        );

        const startPromise1 = subscription.start();
        vi.advanceTimersByTime(25);
        await Promise.resolve();

        const startPromise2 = subscription.start();
        expect(consoleSpy).toHaveBeenCalledWith('VidaTransactionSubscription is already running');

        await subscription.stop();
        await vi.advanceTimersByTimeAsync(50);
        await startPromise1;
        await startPromise2;

        consoleSpy.mockRestore();
    });

    test('should not stop if not running', async () => {
        const pwrjs = createMockPWRJS('1500', []);
        const handler: ProcessVidaTransactions = vi.fn();

        const subscription = new VidaTransactionSubscription(
            pwrjs,
            BigInt(705),
            BigInt(1000),
            handler,
            50
        );

        expect(subscription.isRunning()).toBe(false);
        await subscription.stop(); // Should return immediately
        expect(subscription.isRunning()).toBe(false);
    });
});
