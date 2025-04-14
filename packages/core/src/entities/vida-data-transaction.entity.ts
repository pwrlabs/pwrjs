import { Transaction } from '../record/transaction';

export type VmDataTransaction = Transaction & {
    vmId: string;
    data: string;
};
