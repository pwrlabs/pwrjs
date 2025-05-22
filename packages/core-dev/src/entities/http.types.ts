import { VmDataTransaction } from '../record/vmDataTransaction';

import { Block } from './block.entity';
import { Validator } from './validator.entity';
import { AnyFalconTransaction } from './falcon-transaction.entity';

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
        nonce: number;
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

    export type IsTransactionValidForGuardianApprovalResponse = {
        valid: boolean;
        guardian: string;
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

    export type BlockWithVidaTransactionsOnly = {
        block: any;
    };
    // #endregion

    // #region transactions

    export type TransactionByHashResponse = {
        transaction: AnyFalconTransaction;
    };

    export type TransactionsByHashesResponse = {
        transactions: AnyFalconTransaction[];
    };

    export type VidaDataTransactionsResponse = {
        transactions: VmDataTransaction[];
    };

    export type VidaDataTransactionsFilteredResponse = {
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

    export type ActiveVotingPwrResponse = {
        activeVotingPower: number;
    };

    export type EarlyWithdrawPenaltyResponse = {
        earlyWithdrawAvailable: boolean;
        penalty: number;
    };

    export type AllEarlyWithdrawPenaltiesResponse = {
        earlyWithdrawPenalties: {
            penalty: number;
            blockNumber: number;
        }[];
    };

    export type WithdrawalOrderResponse = {
        withdrawalOrderFound: boolean;
        withdrawalOrder: any;
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

    export type TotalValidatorCountResponse = {
        validatorsCount: number;
    };

    export type StandbyValidatorCountResponse = {
        validatorsCount: number;
    };

    export type ActiveValidatorCountResponse = {
        validatorsCount: number;
    };

    export type DelegatorsCountResponse = {
        delegatorsCount: number;
    };

    export type AllValidatorsResponse = {
        validators: Validator[];
    };

    export type AllStandByValidatorsResponse = {
        validators: Validator[];
    };

    export type AllActiveValidatorsResponse = {
        validators: Validator[];
    };

    export type allDelegateesOfUserResponse = {
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

    export type validatorResponse = {
        validator: Validator;
    };

    export type DelegatedPwrResponse = {
        delegatedPWR: bigint;
    };

    export type SharesOfDelegatorResponse = {
        shares: number;
    };

    export type ShareValueResponse = {
        shareValue: bigint;
    };

    // #endregion

    // #region vida

    export type vidaOwnerTransactionFeeShareResponse = {
        vmOwnerTransactionFeeShare: number;
    };

    export type vidaClaimingFeeResponse = {
        vidaIdClaimingFee: number;
    };

    export type OwrnerOfVidaResponse = {
        owner?: string;
        claimed: boolean;
    };

    export type SponsoredAddressResponse = {
        sponsoredAddresses: string[];
    };

    export type VidaAllowedSendersResponse = {
        allowedSenders: string[];
    };

    export type IsVidaPrivateResponse = {
        isPrivate: boolean;
    };

    export type ConduitsOfVidaResponse = {
        conduits: Validator[];
    };

    export type IsOwnerAllowedToTransferPWRFromVidaResponse = {
        allowed: boolean;
    };

    export type AreConduitsAllowedToTransferPWRFromVidaResponse = {
        allowed: boolean;
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
