// export interface FalconTransaction {}

export enum Transactions {
    TRANSFER = 1006,
    SET_PUBLIC_KEY = 1001,
    JOIN_AS_VALIDATOR = 1002,
    DELEGATE = 1003,
    CHANGE_IP = 1004,
    CLAIM_NODE_SPOT = 1005,
    WITHDRAW = 1026,
    CLAIM_VIDA_ID = 1028,
    REMOVE_VALIDATOR = 1025,
    SET_GUARDIAN = 1023,
    REMOVE_GUARDIAN = 1022,
    GUARDIAN_APPROVAL = 1021,
    PAYABLE_VIDA_DATA = 1030,
    CONDUIT_APPROVAL = 1029,
    REMOVE_CONDUITS = 1031,
    MOVE_STAKE = 1024,
    SET_CONDUIT_MODE = 1033,
    ADD_VIDA_ALLOWED_SENDERS = 1037,
    ADD_VIDA_SPONSORED_ADDRESSES = 1036,
    REMOVE_SPONSORED_ADDRESSES = 1039,
    REMOVE_VIDA_ALLOWED_SENDERS = 1038,
    SET_VIDA_PRIVATE_STATE = 1034,
    SET_VIDA_ABSOLUTE_PUBLIC = 1035,
    SET_PWR_TRANSFER_RIGHTS = 1040,
    TRANSFER_PWR_FROM_VIDA = 1041,
}

export type FalconTransaction = {
    identifier: string;
    hash: string;
    sender: string;
    nonce: number;
    size: number;
    positionInBlock: number;
    blockNumber: number;
    timeStamp: EpochTimeStamp;
    feePerByte: number;
    paidActionFee: string;
    paidTotalFee: string;
    wrapped?: boolean;
    positionInWrappedTransactions?: number;
    success: boolean;
    errorMessage?: string | null;
};

export type TransferTransaction = FalconTransaction & {
    receiver: string;
    amount: number;
};

export type SetPublicKeyTransaction = FalconTransaction & {
    publicKey: Uint8Array;
};

export type JoinAsValidatorTransaction = FalconTransaction & {
    ip: string;
};

export type DelegateTransaction = FalconTransaction & {
    validator: string;
    pwrAmount: number;
};

export type ChangeIpTransaction = FalconTransaction & {
    newIp: string;
};

export type ClaimActiveNodeSpotTransaction = FalconTransaction & {};

export type WithdrawTransaction = FalconTransaction & {
    validator: string;
    sharesAmount: string;
};

export type ClaimVidaIdTransaction = FalconTransaction & {
    vidaId: number;
};

export type RemoveValidatorTransaction = FalconTransaction & {
    validatorAddress: string;
};

export type SetGuardianTransaction = FalconTransaction & {
    guardianAddress: string;
    guardianExpiryDate: EpochTimeStamp;
};

export type RemoveGuardianTransaction = FalconTransaction & {};

export type GuardianApprovalTransaction = FalconTransaction & {
    transactions: string[];
};

export type PayableVidaDataTransaction = FalconTransaction & {
    vidaId: number;
    data: Uint8Array;
    value: number;
};

export type ConduitApprovalTransaction = FalconTransaction & {
    vidaId: number;
    transactions: string[];
};

export type RemoveConduitsTransaction = FalconTransaction & {
    vidaId: number;
    conduits: string[];
};

export type MoveStakeTransaction = FalconTransaction & {
    fromValidator: string;
    toValidator: string;
    sharesAmount: string;
};

export type SetConduitModeTransaction = FalconTransaction & {
    vidaId: number;
    mode: number;
    conduitThreshold: number;
    conduits: string[];
    vidaConduits: Record<string, number>;
};

export type AddVidaAllowedSendersTransaction = FalconTransaction & {
    vidaId: number;
    allowedSenders: string[];
};

export type AddVidaSponsoredAddressesTransaction = FalconTransaction & {
    vidaId: number;
    sponsoredAddresses: string[];
};

export type RemoveSponsoredAddressesTransaction = FalconTransaction & {
    vidaId: number;
    sponsoredAddresses: string[];
};

export type RemoveVidaAllowedSendersTransaction = FalconTransaction & {
    vidaId: number;
    allowedSenders: string[];
};

export type SetVidaPrivateStateTransaction = FalconTransaction & {
    vidaId: number;
    privateState: boolean;
};

export type SetVidaAbsolutePublicTransaction = FalconTransaction & {
    vidaId: number;
};

export type SetPWRTransferRightsTransaction = TransferTransaction & {
    vidaId: number;
    ownerCanTransferPWR: boolean;
};

export type TransferPWRFromVidaTransaction = FalconTransaction & {
    vidaId: number;
    receiver: string;
};

export type AnyFalconTransaction =
    | TransferTransaction
    | SetPublicKeyTransaction
    | JoinAsValidatorTransaction
    | DelegateTransaction
    | ChangeIpTransaction
    | ClaimActiveNodeSpotTransaction
    | WithdrawTransaction
    | ClaimVidaIdTransaction
    | RemoveValidatorTransaction
    | SetGuardianTransaction
    | RemoveGuardianTransaction
    | GuardianApprovalTransaction
    | PayableVidaDataTransaction
    | ConduitApprovalTransaction
    | RemoveConduitsTransaction
    | MoveStakeTransaction
    | SetConduitModeTransaction
    | AddVidaAllowedSendersTransaction
    | AddVidaSponsoredAddressesTransaction
    | RemoveSponsoredAddressesTransaction
    | RemoveVidaAllowedSendersTransaction
    | SetVidaPrivateStateTransaction
    | SetVidaAbsolutePublicTransaction
    | SetPWRTransferRightsTransaction
    | TransferPWRFromVidaTransaction;
