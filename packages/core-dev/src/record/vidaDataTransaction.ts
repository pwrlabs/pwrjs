import { Transaction } from './transaction';

export type VidaDataTransaction = Transaction & {
    vidaId: string;
    data: string;
};
