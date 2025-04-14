import { VmDataTransaction } from '../record/vmDataTransaction';

// vm

// validator

export type TotalValidatorCountRes = {
    validatorsCount: number;
};

export type StandbyValidatorCountRes = {
    validatorsCount: number;
};

export type ActiveValidatorCountRes = {
    validatorsCount: number;
};

export type DelegatorsCount = {
    delegatorsCount: number;
};

export type AllValidtorsRes = {
    validators: {
        votingPower: number;
        address: string;
        ip: string;
        delegatorsCount: number;
        totalShares: number;
        badActor?: boolean;
        status: string;
    }[];
};

// proposals

export type OwrnerOfVMRes = {
    owner?: string;
    claimed: boolean;
};
