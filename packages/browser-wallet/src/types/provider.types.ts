import { TxnTypes } from './transaction.types';

interface DisconnectRequest {
    /**
     * The address to disconnect.
     */
    address: string;
}

interface SignatureRequest {
    /**
     * The address that will sign the message.
     */
    from: string;

    /**
     * The message to be signed.
     */
    message: string;
}

export interface PwrI {
    // data
    name: string;
    version: string;

    // actions
    getConnections(): Promise<string[]>;
    connect(): Promise<any>;
    disconnect(txnData: DisconnectRequest): Promise<any>;
    getFingerprints(): Promise<string>;

    // sign message function
    signMessage(txnData: SignatureRequest): Promise<any>;

    // automated transactions
    enableAutomatedTxns(): Promise<any>;
    areAutomatedTransactionsEnabled(): Promise<boolean>;
    disableAutomatedTxns(): Promise<any>;

    // transactions
    transferPwr(txnData: TxnTypes.TransferTxn): Promise<any>;
    payableVidaDataTransaction(txnData: TxnTypes.PayableVidaDataTxn): Promise<any>;
    claimVidaId(txnData: TxnTypes.ClaimVidaIdTxn): Promise<any>;
    delegate(txnData: TxnTypes.DelegateTxn): Promise<any>;
    withdraw(txnData: TxnTypes.WithdrawTxn): Promise<any>;
    moveStake(txnData: TxnTypes.MoveStakeTxn): Promise<any>;

    // proposals
    proposeEarlyWithdrawPenalty(txnData: TxnTypes.EarlyWithdrawPenaltyTxn): Promise<any>;
    proposeChangefeePerByte(txnData: TxnTypes.FeePerByteTxn): Promise<any>;
    maxBlockSize(txnData: TxnTypes.MaxBlockSizeTxn): Promise<any>;
    maxTransactionSize(txnData: TxnTypes.MaxTransactionSizeTxn): Promise<any>;
    overallBurnPercentage(txnData: TxnTypes.OverallBurnPercentageTxn): Promise<any>;
    rewardPerYear(txnData: TxnTypes.RewardPerYearTxn): Promise<any>;
    validatorCountLimit(txnData: TxnTypes.ValidatorCountLimitTxn): Promise<any>;
    validatorJoiningFee(txnData: TxnTypes.ValidatorJoiningFeeTxn): Promise<any>;
    vidaIdClaimingFee(txnData: TxnTypes.VidaIdClaimingFeeTxn): Promise<any>;
    VidaOwnerTransactionFeeShare(txnData: TxnTypes.VidaOwnerTransactionFeeShareTxn): Promise<any>;
    otherProposal(txnData: TxnTypes.otherProposalTxn): Promise<any>;

    voteOnProposal(txnData: TxnTypes.VoteOnProposalTxn): Promise<any>;

    // events
    onConnect: {
        addListener: (callback: (addresses: string[]) => void) => void;
    };
    onDisconnect: {
        addListener: (callback: (address: string) => void) => void;
    };
    onAccountChange: {
        addListener: (callback: (accounts: string[]) => void) => void;
    };
}
