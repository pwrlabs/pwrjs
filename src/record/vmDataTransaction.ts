import { Transaction } from './transaction';

export type VmDataTransaction = Transaction & {
    vmId: string;
    data: string;
};
