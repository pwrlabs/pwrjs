interface TxnBase {
    /**
     * The address from which the transaction is being sent.
     */
    from: string;
}

interface AmountTxn {
    /**
     * The amount of tokens to be transferred.
     */
    amount: string;
}

interface toVidaTxn {
    /**
     * The Vida ID related to the transaction.
     */
    vidaId: string;
}

interface toValidatorTxn {
    /**
     * The validator address related to the transaction.
     */
    validator: string;
}

interface ProposalTxn {
    /**
     * The title of the proposal.
     */
    title: string;

    /**
     * The description of the proposal.
     */
    description: string;
}

export interface TransferTxn extends TxnBase, AmountTxn {
    /**
     * The address to which the tokens are being sent.
     */
    to: string;
}

export interface PayableVidaDataTxn extends TxnBase, AmountTxn, toVidaTxn {
    /**
     * The data to be sent, encoded as bytes. See https
     */
    data: Uint8Array;
}

// #region validator
export interface ClaimVidaIdTxn extends TxnBase, toVidaTxn {}

export interface DelegateTxn extends toValidatorTxn, AmountTxn, TxnBase {}

export interface WithdrawTxn extends toValidatorTxn, TxnBase {
    /**
     * The amount of shares to withdraw.
     */
    sharesAmount: string;
}

export interface MoveStakeTxn extends TxnBase {
    /**
     * The amount of shares to move.
     */
    shareAmount: string;
    /**
     * The validator from which the stake is being moved.
     */
    fromValidator: string;
    /**
     * The validator to which the stake is being moved.
     */
    toValidator: string;
}

// #endregion

// #region proposals

export interface EarlyWithdrawPenaltyTxn extends ProposalTxn, TxnBase {
    /**
     * The time after which early withdrawal is allowed.
     */
    earlyWithdrawalTime: string;

    /**
     * The penalty for early withdrawal.
     */
    withdrawalPenalty: number;
}

export interface FeePerByteTxn extends ProposalTxn, TxnBase {
    /**
     * The fee per byte for transactions.
     */
    feePerByte: string;
}

export interface MaxBlockSizeTxn extends ProposalTxn, TxnBase {
    /**
     * The maximum block size in bytes.
     */
    maxBlockSize: number;
}

export interface MaxTransactionSizeTxn extends ProposalTxn, TxnBase {
    /**
     * The maximum transaction size in bytes.
     */
    maxTxnSize: number;
}

export interface OverallBurnPercentageTxn extends ProposalTxn, TxnBase {
    /**
     * The percentage of tokens to be burned.
     */
    burnPercentage: number;
}

export interface RewardPerYearTxn extends ProposalTxn, TxnBase {
    /**
     * The reward per year in string format.
     */
    rewardPerYear: string;
}

export interface ValidatorCountLimitTxn extends ProposalTxn, TxnBase {
    /**
     * The limit on the number of validators.
     */
    validatorCountLimit: number;
}

export interface ValidatorJoiningFeeTxn extends ProposalTxn, TxnBase {
    /**
     * The joining fee for validators.
     */
    joiningFee: string;
}

export interface VidaIdClaimingFeeTxn extends ProposalTxn, TxnBase {
    /**
     * The claiming fee for VM IDs.
     */
    claimingFee: string;
}

export interface VidaOwnerTransactionFeeShareTxn extends ProposalTxn, TxnBase {
    /**
     * The fee share percentage for VM owners.
     */
    feeShare: number;
}

export interface otherProposalTxn extends ProposalTxn, TxnBase {}

export interface VoteOnProposalTxn extends TxnBase {
    /**
     * The hash of the proposal being voted on.
     */
    proposalHash: string;

    /**
     * The vote value, typically 1 for yes and 0 for no.
     */
    vote: number;
}

// #endregion

export * as TxnTypes from './transaction.types';
