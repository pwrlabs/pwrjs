import { VidaDataTransaction } from '../record/vidaDataTransaction';
import PWRJS from './pwrjs';

export type ProcessVidaTransactions = (transaction: VidaDataTransaction) => void;
export type BlockSaver = (blockNumber: bigint) => void | Promise<void>;

export class VidaTransactionSubscription {
    private pwrjs: PWRJS;
    private vidaId: bigint;
    private startingBlock: bigint;
    private latestCheckedBlock: bigint;
    private handler: ProcessVidaTransactions;
    private pollInterval: number;
    private blockSaver?: BlockSaver;

    // Internal state flags - atomic-like behavior
    private _wantsToPause: boolean = false;
    private _paused: boolean = false;
    private _stop: boolean = false;
    private _running: boolean = false;

    constructor(
        pwrjs: PWRJS,
        vidaId: bigint,
        startingBlock: bigint,
        handler: ProcessVidaTransactions,
        pollInterval: number = 100,
        blockSaver?: BlockSaver
    ) {
        this.pwrjs = pwrjs;
        this.vidaId = vidaId;
        this.startingBlock = startingBlock;
        this.latestCheckedBlock = startingBlock;
        this.handler = handler;
        this.pollInterval = pollInterval;
        this.blockSaver = blockSaver;
    }

    public async start(): Promise<void> {
        if (this._running) {
            console.error('VidaTransactionSubscription is already running');
            return;
        }

        this._running = true;
        this._wantsToPause = false;
        this._paused = false;
        this._stop = false;

        // Set latestCheckedBlock to startingBlock
        this.latestCheckedBlock = this.startingBlock - BigInt(1);

        while (!this._stop) {
            if (this._wantsToPause) {
                if (!this._paused) {
                    this._paused = true;
                }
                await this.sleep(10); // Small sleep to avoid busy waiting
                continue;
            } else {
                if (this._paused) {
                    this._paused = false;
                }
            }

            try {
                const latestBlock = BigInt(await this.pwrjs.getLatestBlockNumber());
                
                // Skip if no new blocks to process
                if (latestBlock == this.latestCheckedBlock) {
                    continue;
                }

                const maxBlockToCheck = latestBlock > this.latestCheckedBlock + BigInt(1000) 
                    ? this.latestCheckedBlock + BigInt(1000) 
                    : latestBlock;

                const transactions = await this.pwrjs.getVidaDataTransactions(
                    (this.latestCheckedBlock + BigInt(1)).toString(),
                    maxBlockToCheck.toString(),
                    this.vidaId
                );

                // Process each transaction with individual error handling
                transactions.forEach((transaction) => {
                    try {
                        this.handler(transaction);
                    } catch (e: any) {
                        console.error(`Failed to process VIDA transaction: ${transaction.hash} - ${e.message}`);
                        console.error(e.stack);
                    }
                });

                this.latestCheckedBlock = maxBlockToCheck;
                
                // Save the latest checked block if blockSaver is provided
                if (this.blockSaver) {
                    try {
                        await this.blockSaver(this.latestCheckedBlock);
                    } catch (e: any) {
                        console.error(`Failed to save latest checked block: ${this.latestCheckedBlock} - ${e.message}`);
                        console.error(e.stack);
                    }
                }
            } catch (error: any) {
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    console.error(`Network error fetching VIDA transactions: ${error.message}`);
                } else {
                    console.error(`Failed to fetch VIDA transactions: ${error.message}`);
                    console.error(error.stack);
                }
            } finally {
                await this.sleep(this.pollInterval);
            }
        }

        this._running = false;
    }

    public async pause(): Promise<void> {
        this._wantsToPause = true;

        // Wait until actually paused
        while (!this._paused && this._running) {
            await this.sleep(10);
        }
    }

    public resume(): void {
        this._wantsToPause = false;
    }

    public async stop(): Promise<void> {
        if (!this._running) {
            return;
        }

        console.log(`Stopping VidaTransactionSubscription for VIDA-ID: ${this.vidaId}`);
        await this.pause();
        this._stop = true;

        // Wait for the main loop to finish
        while (this._running) {
            await this.sleep(10);
        }

        console.log(`VidaTransactionSubscription for VIDA-ID: ${this.vidaId} has been stopped.`);
    }

    public isRunning(): boolean {
        return this._running;
    }

    public isPaused(): boolean {
        return this._wantsToPause;
    }

    public isStopped(): boolean {
        return this._stop;
    }

    public setLatestCheckedBlock(blockNumber: bigint): void {
        this.latestCheckedBlock = blockNumber;
    }

    public getLatestCheckedBlock(): bigint {
        return this.latestCheckedBlock;
    }

    public getStartingBlock(): bigint {
        return this.startingBlock;
    }

    public getVidaId(): bigint {
        return this.vidaId;
    }

    public getHandler(): ProcessVidaTransactions {
        return this.handler;
    }

    public getPwrj(): PWRJS {
        return this.pwrjs;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
