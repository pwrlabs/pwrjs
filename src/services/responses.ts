import { VmDataTransaction } from '../record/vmDataTransaction';

export type ChainRes = {
    chainId: number;
};

export type FeePerByteRes = {
    feePerByte: number;
};

export type EcsdaFeeRes = {
    ecdsaVerificationFee: number;
};

export type BLockchainVersionRes = {
    blockchainVersion: number;
};

// wallet

export type NonceRes = {
    nonce: string;
};

export type BalanceRes = {
    balance: string;
};

// general
export type BurnPercentageRes = {
    burnPercentage: number;
};

export type TotalVotingPowerRes = {
    totalVotingPower: number;
};

export type RewardsPerYearRes = {
    pwrRewardsPerYear: number;
};

export type WithdrawlLockTimeRes = {
    withdrawalLockTime: number;
};

// blocks

export type BlocksCountRes = {
    latestBlocksHash: string;
    blocksCount: number;
};

export type MaxBlockRes = {
    maxBlockSize: number;
};

export type MaxTransactionSizeRes = {
    maxTransactionSize: number;
};

export type ValidatorCountRes = {
    validatorCountLimit: number;
};

export type BlockNumberRes = {
    blockNumber: number;
};

export type BLockTimestamp = {
    blockTimestamp: number;
};

export type BlockRes = {
    block: {
        processedWithoutCriticalErrors: boolean;
        blockHash: string;
        networkVotingPower: number;
        blockNumber: number;
        blockReward: number;
        transactionCount: number;
        transactions: {
            positionInTheBlock: number;
            size: number;
            receiver: string;
            sender: string;
            success: boolean;
            fee: number;
            paid: boolean;
            type: string;
            nonce: number;
            value: number;
            extraFee: number;
            hash: string;
        }[];
        blockSubmitter: string;
        blockSize: number;
        timestamp: number;
    };
};

// vm
export type vmOwnerTransactionFeeShareRes = {
    vmOwnerTransactionFeeShare: number;
};

export type vmClaimingFeeRes = {
    vmIdClaimingFee: number;
};

export type VmDataTransactionsRes = {
    transactions: VmDataTransaction[];
};

// guardian
export type MaxGuardianTimeRes = {
    maxGuardianTime: number;
};

// validator
export type ValidatorOperationalFeeRes = {
    validatorOperationalFee: number;
};

export type ValidatorJoiningFeeRes = {
    validatorJoiningFee: number;
};

export type ValidatorSlashingFeeRes = {
    validatorSlashingFee: number;
};

export type MinimunDelegatingAmountRes = {
    minimumDelegatingAmount: number;
};

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
export type ProposalFeeRes = {
    proposalFee: number;
};

export type ProposalValidityTimeRes = {
    proposalValidityTime: number;
};
