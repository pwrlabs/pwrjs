import { Transactions, AnyFalconTransaction } from 'src/entities/falcon-transaction.entity'; // importa tus enums y tipos

export function deserializeTransaction(transaction: any): AnyFalconTransaction {
    switch (transaction.identifier) {
        case Transactions.TRANSFER:
            return transaction as import('src/entities/falcon-transaction.entity').TransferTransaction;
        case Transactions.SET_PUBLIC_KEY:
            return transaction as import('src/entities/falcon-transaction.entity').SetPublicKeyTransaction;
        case Transactions.JOIN_AS_VALIDATOR:
            return transaction as import('src/entities/falcon-transaction.entity').JoinAsValidatorTransaction;
        case Transactions.DELEGATE:
            return transaction as import('src/entities/falcon-transaction.entity').DelegateTransaction;
        case Transactions.CHANGE_IP:
            return transaction as import('src/entities/falcon-transaction.entity').ChangeIpTransaction;
        case Transactions.CLAIM_NODE_SPOT:
            return transaction as import('src/entities/falcon-transaction.entity').ClaimActiveNodeSpotTransaction;
        case Transactions.WITHDRAW:
            return transaction as import('src/entities/falcon-transaction.entity').WithdrawTransaction;
        case Transactions.CLAIM_VIDA_ID:
            return transaction as import('src/entities/falcon-transaction.entity').ClaimVidaIdTransaction;
        case Transactions.REMOVE_VALIDATOR:
            return transaction as import('src/entities/falcon-transaction.entity').RemoveValidatorTransaction;
        case Transactions.SET_GUARDIAN:
            return transaction as import('src/entities/falcon-transaction.entity').SetGuardianTransaction;
        case Transactions.REMOVE_GUARDIAN:
            return transaction as import('src/entities/falcon-transaction.entity').RemoveGuardianTransaction;
        case Transactions.GUARDIAN_APPROVAL:
            return transaction as import('src/entities/falcon-transaction.entity').GuardianApprovalTransaction;
        case Transactions.PAYABLE_VIDA_DATA:
            return transaction as import('src/entities/falcon-transaction.entity').PayableVidaDataTransaction;
        case Transactions.CONDUIT_APPROVAL:
            return transaction as import('src/entities/falcon-transaction.entity').ConduitApprovalTransaction;
        case Transactions.REMOVE_CONDUITS:
            return transaction as import('src/entities/falcon-transaction.entity').RemoveConduitsTransaction;
        case Transactions.MOVE_STAKE:
            return transaction as import('src/entities/falcon-transaction.entity').MoveStakeTransaction;
        case Transactions.SET_CONDUIT_MODE:
            return transaction as import('src/entities/falcon-transaction.entity').SetConduitModeTransaction;
        case Transactions.ADD_VIDA_ALLOWED_SENDERS:
            return transaction as import('src/entities/falcon-transaction.entity').AddVidaAllowedSendersTransaction;
        case Transactions.ADD_VIDA_SPONSORED_ADDRESSES:
            return transaction as import('src/entities/falcon-transaction.entity').AddVidaSponsoredAddressesTransaction;
        case Transactions.REMOVE_SPONSORED_ADDRESSES:
            return transaction as import('src/entities/falcon-transaction.entity').RemoveSponsoredAddressesTransaction;
        case Transactions.REMOVE_VIDA_ALLOWED_SENDERS:
            return transaction as import('src/entities/falcon-transaction.entity').RemoveVidaAllowedSendersTransaction;
        case Transactions.SET_VIDA_PRIVATE_STATE:
            return transaction as import('src/entities/falcon-transaction.entity').SetVidaPrivateStateTransaction;
        case Transactions.SET_VIDA_ABSOLUTE_PUBLIC:
            return transaction as import('src/entities/falcon-transaction.entity').SetVidaAbsolutePublicTransaction;
        case Transactions.SET_PWR_TRANSFER_RIGHTS:
            return transaction as import('src/entities/falcon-transaction.entity').SetPWRTransferRightsTransaction;
        case Transactions.TRANSFER_PWR_FROM_VIDA:
            return transaction as import('src/entities/falcon-transaction.entity').TransferPWRFromVidaTransaction;
        default:
            throw new Error(`Unknown transaction identifier: ${transaction.identifier}`);
    }
}
