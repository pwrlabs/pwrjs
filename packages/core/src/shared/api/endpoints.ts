const endpoints = {
    // The base URL for the API
    baseUrl: 'https://api.example.com',

    pwrrpc: {
        // #blockchain props

        chain_id: '/chainId/',

        feePerByte: '/feePerByte/',

        blockchainVersion: '/blockchainVersion/',

        // #endregion

        // #region wallet

        publicKeyOfAddress: '/publicKeyOfAddress/?address=:address',

        nonceOfAddress: '/nonceOfUser/?userAddress=:address',

        balanceOfAddress: '/balanceOf/?userAddress=:address',

        // #endregion

        // #region guardian

        guardianOfAddress: '/guardianOf/?userAddress=:address',

        maxGuardianTime: '/maxGuardianTime/',

        // #endregion

        // #region blocks

        blocksCount: '/blocksCount/',

        maxBlockSize: '/maxBlockSize/',

        maxTransactionSize: '/maxTransactionSize/',

        blockNumber: '/blockNumber/',

        blockTimestamp: '/blockTimestamp/',

        block: '/block/?blockNumber=:blockNumber',

        blockWithExtactedData:
            '/blockExcludingDataAndExtraData/?blockNumber=:blockNumber',

        blockWithVmDataTransactionsOnly:
            '/blockWithVmDataTransactionsOnly/?blockNumber=:blockNumber&vmId=:vidaId',

        // #endregion

        // #region transactions

        transactionByHash:
            '/transactionByHash/?transactionHash=:transactionHash',

        transactionsByHashes: '/getTransactionsByHashes',

        vidaDataTransactions:
            '/getVidaTransactions/?startingBlock=:startingBlock&endingBlock=:endingBlock&vidaId=:vidaId',

        // #endregion

        // #region general
        burnPercentage: '/burnPercentage/',

        totalVotingPower: '/totalVotingPower/',

        pwrRewardsPerYear: '/pwrRewardsPerYear/',

        withdrawalLockTime: '/withdrawalLockTime/',
        // #endregion

        // #region validators

        validatorCountLimit: '/validatorCountLimit/',

        validatorSlashingFee: '/validatorSlashingFee/',

        validatorOperationalFee: '/validatorOperationalFee/',

        validatorJoiningFee: '/validatorJoiningFee/',

        minimumDelegatingAmount: '/minimumDelegatingAmount/',

        // #endregion

        // #region vida

        vidaOwnerTransactionFeeShare: '/vmOwnerTransactionFeeShare/',

        vidaIdClaimingFee: '/vidaIdClaimingFee/',

        // #endregion

        // #region proposal
        proposalFee: '/proposalFee/',

        proposalValidityTime: '/proposalValidityTime/',

        proposalStatus: '/proposalStatus/?proposalHash=:proposalHash',
        // #endregion

        // #region others
        ecdsaVerificationFee: '/ecdsaVerificationFee/',
    },
};
