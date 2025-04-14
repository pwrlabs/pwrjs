import { VmDataTransaction } from '../record/vmDataTransaction';
import { Block } from './block.entity';
import { FalconTransaction } from './falcon-transaction.entity';

export namespace HttpTypes {
    export type ChainIdResponse = {
        chainId: number;
    };

    export type FeePerByteResponse = {
        feePerByte: number;
    };

    export type BLockchainVersionResponse = {
        blockchainVersion: number;
    };

    // #region wallet

    export type PublicKeyOfAddressResponse = {
        falconPublicKey: string;
    };

    export type NonceResponse = {
        nonce: string;
    };

    export type BalanceResponse = {
        balance: string;
    };

    // #endregion

    // #region guardians

    export type GuardianResponse = {
        isGuarded?: boolean;
        guardian: string;
        expiryDate: EpochTimeStamp;
    };

    export type MaxGuardianTimeResponse = {
        maxGuardianTime: number;
    };

    // #endregion

    // #region blockchain entities
    export type BlocksCountResponse = {
        latestBlocksHash: string;
        blocksCount: number;
    };

    export type MaxBlockResponse = {
        maxBlockSize: number;
    };

    export type MaxTransactionSizeResponse = {
        maxTransactionSize: number;
    };

    export type BlockNumberResponse = {
        blockNumber: number;
    };

    export type BLockTimestampResponse = {
        blockTimestamp: number;
    };

    export type BlockResponse = {
        block: Block;
    };

    export type BlockExcludingDataResponse = {
        block: any;
    };

    export type BlockWithVidaTransactionsOnly = {
        block: any;
    };
    // #endregion

    // #region transactions

    export type TransactionByHashResponse = {
        transaction: FalconTransaction;
    };

    export type TransactionsByHashesResponse = {
        transactions: FalconTransaction[];
    };

    export type VidaDataTransactionsRes = {
        transactions: VmDataTransaction[];
    };

    // #endregion

    // #region general
    export type BurnPercentageResponse = {
        burnPercentage: number;
    };

    export type TotalVotingPowerResponse = {
        totalVotingPower: number;
    };

    export type RewardsPerYearResponse = {
        pwrRewardsPerYear: number;
    };

    export type WithdrawlLockTimeResponse = {
        withdrawalLockTime: number;
    };
    // #endregion

    // #region validators
    export type ValidatorCountResponse = {
        validatorCountLimit: number;
    };

    export type ValidatorSlashingFeeResponse = {
        validatorSlashingFee: number;
    };

    export type ValidatorOperationalFeeResponse = {
        validatorOperationalFee: number;
    };

    export type ValidatorJoiningFeeResponse = {
        validatorJoiningFee: number;
    };

    export type MinimunDelegatingAmountResponse = {
        minimumDelegatingAmount: number;
    };

    // #endregion

    // #region vida

    export type vidaOwnerTransactionFeeShareResponse = {
        vmOwnerTransactionFeeShare: number;
    };

    export type vidaClaimingFeeResponse = {
        vmIdClaimingFee: number;
    };

    // #endregion

    // #region proposals
    export type ProposalFeeResponse = {
        proposalFee: number;
    };

    export type ProposalValidityTimeResponse = {
        proposalValidityTime: number;
    };

    export type ProposalStatusResponse = {
        status: string;
    };

    // #endregion

    // #region others
    export type EcsdaFeeRes = {
        ecdsaVerificationFee: number;
    };
    // #endregion
}
