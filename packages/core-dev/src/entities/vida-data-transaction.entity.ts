import { Transaction } from '../record/transaction';

export type VidaDataTransaction = Transaction & {
    vidaId: string;
    data: string;
};
