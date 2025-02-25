import { VmDataTransaction } from '../record/vmDataTransaction';
import PWRJS from './pwrjs';

export interface IvaTransactionHandler {
    processIvaTransactions(transaction: VmDataTransaction): void;
}

export class IvaTransactionSubscription {
    private pwrjs: PWRJS;
    private vmId: bigint;
    private startingBlock: bigint;
    private latestCheckedBlock: bigint;
    private handler: IvaTransactionHandler;
    private pollInterval: number;

    // Internal state flags
    private _pause: boolean = false;
    private _stop: boolean = false;
    private _running: boolean = false;

    constructor(
        pwrj: PWRJS,
        vmId: bigint,
        startingBlock: bigint,
        handler: IvaTransactionHandler,
        pollInterval: number = 100
    ) {
        this.pwrjs = pwrj;
        this.vmId = vmId;
        this.startingBlock = startingBlock;
        this.latestCheckedBlock = startingBlock;
        this.handler = handler;
        this.pollInterval = pollInterval;
    }

    public async start(): Promise<void> {
        if (this._running) {
            console.error('IvaTransactionSubscription is already running');
            return;
        }

        this._running = true;
        this._pause = false;
        this._stop = false;

        let currentBlock = this.startingBlock;

        while (!this._stop) {
            if (this._pause) {
                await this.sleep(this.pollInterval);
                continue;
            }

            try {
                const _ = await this.pwrjs.getLatestBlockNumber();
                const latestBlock = BigInt(_);
                const maxBlockToCheck =
                    latestBlock < currentBlock + BigInt(1000)
                        ? latestBlock
                        : currentBlock + BigInt(1000);

                const transactions = await this.pwrjs.getVMDataTransactions(
                    currentBlock.toString(),
                    maxBlockToCheck.toString(),
                    this.vmId.toString()
                );

                transactions.forEach((transaction) => {
                    this.handler.processIvaTransactions(transaction);
                });

                this.latestCheckedBlock = maxBlockToCheck;
                currentBlock = maxBlockToCheck;
            } catch (error: any) {
                // print trace
                console.log(error.stack);

                console.error(
                    'Failed to fetch and process VM data transactions: ' +
                        error.message
                );
                console.error(
                    'Fetching and processing VM data transactions has stopped'
                );
                break;
            } finally {
                await this.sleep(this.pollInterval);
            }
        }

        this._running = false;
    }

    public pause(): void {
        this._pause = true;
    }

    public resume(): void {
        this._pause = false;
    }

    public stop(): void {
        this._stop = true;
    }

    public isRunning(): boolean {
        return this._running;
    }

    public isPaused(): boolean {
        return this._pause;
    }

    public isStopped(): boolean {
        return this._stop;
    }

    public getLatestCheckedBlock(): bigint {
        return this.latestCheckedBlock;
    }

    public getStartingBlock(): bigint {
        return this.startingBlock;
    }

    public getVmId(): bigint {
        return this.vmId;
    }

    public getHandler(): IvaTransactionHandler {
        return this.handler;
    }

    public getPwrj(): PWRJS {
        return this.pwrjs;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
