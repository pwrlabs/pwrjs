const api = {
    // The base URL for the API
    baseUrl: 'https://api.example.com',

    rpc: {
        // #blockchain props

        chain_id: '/chainId',
        feePerByte: '/feePerByte',
        blockchainVersion: '/blockchainVersion',

        // #endregion

        // #region wallet

        publicKeyOfAddress: '/publicKeyOfAddress?address=:address',

        nonceOfAddress: '/nonceOfUser?userAddress=:address',

        balanceOfAddress: '/balanceOf?userAddress=:address',

        // #endregion

        guardians: {
            guardianOfAddress: '/guardianOf?userAddress=:address',
            maxGuardianTime: '/maxGuardianTime',
            isTransactionValidForGuardianApproval: '/isTransactionValidForGuardianApproval',
        },

        block: {
            blocksCount: '/blocksCount',
            maxBlockSize: '/maxBlockSize',
            maxTransactionSize: '/maxTransactionSize',
            blockNumber: '/blockNumber',
            blockTimestamp: '/blockTimestamp',
            block: '/block?blockNumber=:blockNumber',
            blockWithVidaDataTransactionsOnly:
                '/blockWithVidaDataTransactions?blockNumber=:blockNumber&vmId=:vidaId',
        },

        transactions: {
            transactionByHash: '/transactionByHash?hash=:hash',
            transactionsByHashes: '/getTransactionsByHashes',
        },

        general: {
            burnPercentage: '/burnPercentage',
            totalVotingPower: '/totalVotingPower',
            pwrRewardsPerYear: '/pwrRewardsPerYear',
            withdrawalLockTime: '/withdrawalLockTime',
            earlyWithdrawPenalty: '/earlyWithdrawPenalty?withdrawTime=:earlyWithdrawPenalty',
            activeVotingPower: '/activeVotingPower',
            allEarlyWithdrawPenalties: '/allEarlyWithdrawPenalties',
            withdrawalOrder: '/withdrawalOrder?withdrawalHash=:withdrawalHash',
        },

        validators: {
            validatorCountLimit: '/validatorCountLimit',
            validatorSlashingFee: '/validatorSlashingFee',
            validatorOperationalFee: '/validatorOperationalFee',
            validatorJoiningFee: '/validatorJoiningFee',
            minimumDelegatingAmount: '/minimumDelegatingAmount',
            totalValidatorsCount: '/totalValidatorsCount',
            standbyValidatorsCount: '/standbyValidatorsCount',
            activeValidatorsCount: '/activeValidatorsCount',
            totalDelegatorsCount: '/totalDelegatorsCount',
            allValidators: '/allValidators',
            standbyValidators: '/standbyValidators',
            activeValidators: '/activeValidators',
            delegateesOfUser: '/delegateesOfUser?userAddress=:userAddress',
            validator: '/validator?validatorAddress=:validatorAddress',
            delegatedPwr:
                '/validator/delegator/delegatedPWROfAddress?userAddress=:userAddress&validatorAddress=:validatorAddress',
            sharesOfDelegator:
                '/validator/delegator/sharesOfAddress?userAddress=:userAddress&validatorAddress=:validatorAddress',
            shareValue: '/validator/shareValue?validatorAddress=:validatorAddress',
        },

        vida: {
            vidaOwnerTransactionFeeShare: '/vmOwnerTransactionFeeShare',
            vidaIdClaimingFee: '/vidaIdClaimingFee',
            ownerOfVida: '/ownerOfVidaId?vidaId=:vidaId',
            sponsoredAddresses: '/vidaSponsoredAddresses?vidaId=:vidaId',
            allowedSenders: '/vidaAllowedSenders?vidaId=:vidaId',
            isVidaPrivate: '/isVidaPrivate/?vidaId=:vidaId',
            conduitsOfVida: '/conduitsOfVida?vidaId=:vidaId',
            isOwnerAllowedToTransferPWRFromVida:
                '/isOwnerAllowedToTransferPWRFromVida?vidaId=:vidaId',
            areConduitsAllowedToTransferPWRFromVida:
                '/areConduitsAllowedToTransferPWRFromVida?vidaId=:vidaId',
            vidaDataTransactions:
                '/getVidaTransactions?startingBlock=:startingBlock&endingBlock=:endingBlock&vidaId=:vidaId',
            VmTransactionsSortByBytePrefix:
                '/getVmTransactionsSortByBytePrefix?startingBlock=:startingBlock&endingBlock=:endingBlock&vidaId=:vidaId&bytePrefix=:bytePrefix',
        },

        // #region proposal
        proposals: {
            proposalFee: '/proposalFee',
            proposalValidityTime: '/proposalValidityTime',
            proposalStatus: '/proposalStatus?proposalHash=:proposalHash',
        },

        // #endregion

        // #region others
        ecdsaVerificationFee: '/ecdsaVerificationFee',
    },
};

export default api;
