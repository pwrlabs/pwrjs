// entities
import { Block } from '../entities/block.entity';
import { Validator } from '../entities/validator.entity';
import { AnyFalconTransaction } from '../entities/falcon-transaction.entity';
import { HttpTypes } from '../entities/http.types';

// services
import HttpService from '../services/http.service';

// static
import { Transaction_ID } from '../static/enums/transaction.enum';

import { VmDataTransaction } from '../record/vmDataTransaction';
import TransactionDecoder from './transaction-decoder';
import { ProcessVidaTransactions, VidaTransactionSubscription } from './vida';
import { bytesToHex, hexToBytes } from '../utils';

// shared
import api from '../shared/api/api';

export default class PWRJS {
    // private ecdsaVerificationFee: number = 10000;
    private chainId: number;
    private httpSvc: HttpService;

    // #region constructor

    constructor(private rpcNodeUrl: string) {
        this.httpSvc = new HttpService(rpcNodeUrl);
        try {
            this.fetchChainId().then((chainId) => {
                this.chainId = chainId;
            });
        } catch (error) {
            throw new Error('Failed to get chain ID from the RPC node');
        }
    }

    private async fetchChainId(): Promise<number> {
        const res = await this.httpSvc.get<HttpTypes.ChainIdResponse>(api.rpc.chain_id);
        return res.chainId;
    }

    // #endregion

    // #region props

    public setRpcNodeUrl(rpcNodeUrl: string) {
        this.rpcNodeUrl = rpcNodeUrl;
    }

    public getRpcNodeUrl(): string {
        return this.rpcNodeUrl;
    }

    public async getChainId(): Promise<number> {
        if (this.chainId === -1) {
            try {
                const url = api.rpc.chain_id;
                const res = await this.httpSvc.get<HttpTypes.ChainIdResponse>(url);
                this.chainId = res.chainId;
            } catch {
                throw new Error('Failed to get chain ID from the RPC node');
            }
        }

        return this.chainId;
    }

    public setChainId(chainId: number) {
        this.chainId = chainId;
    }

    public async getFeePerByte(): Promise<number> {
        const res = await this.httpSvc.get<HttpTypes.FeePerByteResponse>(api.rpc.feePerByte);
        return res.feePerByte;
    }

    public async getBlockchainVersion(): Promise<number> {
        const url = api.rpc.blockchainVersion;
        const res = await this.httpSvc.get<HttpTypes.BLockchainVersionResponse>(url);
        return res.blockchainVersion;
    }

    // #endregion

    // #region fee

    async getFee(txn: Uint8Array) {
        const feePerByte = await this.getFeePerByte();
        const ecdsaVerificationFee = await this.getEcdsaVerificationFee();

        const decoder = new TransactionDecoder();
        const transaction = decoder.decode(txn) as unknown as {
            sender: string;
            nonce: string;
            size: number;
            rawTransaction: Uint8Array;
            chainId: number;
            transactions: { size: number }[];
            type: number;
        };

        if (transaction.type === Transaction_ID.GUARDIAN_TXN) {
            const guardianApprovalTransaction = transaction;

            const sizeOfAllTransactions = guardianApprovalTransaction.transactions.reduce(
                (acc, curr) => acc + curr.size,
                0
            );

            let fee = txn.length * feePerByte + ecdsaVerificationFee;
            fee += sizeOfAllTransactions * ecdsaVerificationFee;
            return fee;
        } else {
            return txn.length * feePerByte + ecdsaVerificationFee;
        }
    }

    public async getEcdsaVerificationFee(): Promise<number> {
        const res = await this.httpSvc.get<HttpTypes.EcsdaFeeRes>(api.rpc.ecdsaVerificationFee);
        return res.ecdsaVerificationFee;
    }

    // #endregion

    // #region wallet
    public async getPublicKeyOfAddress(address: string): Promise<Uint8Array | null> {
        try {
            const res = await this.httpSvc.get<HttpTypes.PublicKeyOfAddressResponse>(
                api.rpc.publicKeyOfAddress.replace(':address', address)
            );

            const pk = res.falconPublicKey.startsWith('0x')
                ? res.falconPublicKey.substring(2)
                : res.falconPublicKey;

            return hexToBytes(pk);
        } catch {
            return null;
        }
    }

    public async getNonceOfAddress(address: string): Promise<number> {
        const url = api.rpc.nonceOfAddress.replace(':address', address);
        const res = await this.httpSvc.get<HttpTypes.NonceResponse>(url);
        return res.nonce;
    }

    public async getBalanceOfAddress(address: string): Promise<bigint> {
        const url = api.rpc.balanceOfAddress.replace(':address', address);
        const res = await this.httpSvc.get<HttpTypes.BalanceResponse>(url);
        return BigInt(res.balance);
    }

    // #endregion

    // #region general
    public async getBurnPercentage() {
        const url = api.rpc.general.burnPercentage;
        const res = await this.httpSvc.get<HttpTypes.BurnPercentageResponse>(url);

        return res.burnPercentage;
    }

    public async getTotalVotingPower() {
        const url = api.rpc.general.totalVotingPower;
        const res = await this.httpSvc.get<HttpTypes.TotalVotingPowerResponse>(url);
        return res.totalVotingPower;
    }

    public async getPwrRewardsPerYear(): Promise<number> {
        const url = api.rpc.general.pwrRewardsPerYear;
        const res = await this.httpSvc.get<HttpTypes.RewardsPerYearResponse>(url);
        return res.pwrRewardsPerYear;
    }

    public async getWithdrawalLockTime(): Promise<number> {
        const url = api.rpc.general.withdrawalLockTime;
        const res = await this.httpSvc.get<HttpTypes.WithdrawlLockTimeResponse>(url);
        return res.withdrawalLockTime;
    }

    public async getActiveVotingPower(): Promise<number> {
        const url = api.rpc.general.activeVotingPower;
        const res = await this.httpSvc.get<HttpTypes.ActiveVotingPwrResponse>(url);
        return res.activeVotingPower;
    }

    public async getEarlyWithdrawPenalty(
        withdrawTime: EpochTimeStamp
    ): Promise<HttpTypes.EarlyWithdrawPenaltyResponse> {
        const url = api.rpc.general.earlyWithdrawPenalty.replace(
            ':earlyWithdrawPenalty',
            withdrawTime.toString()
        );
        const res = await this.httpSvc.get<HttpTypes.EarlyWithdrawPenaltyResponse>(url);
        return res;

        // const penalties: Record<string, string> = {};

        // for (const key in penaltiesRes) {
        //     const withdrawTime = parseInt(key);
        //     const penalty = penaltiesRes[key];
        //     penalties[withdrawTime] = penalty;
        // }
    }

    public async getAllEarlyWithdrawPenalties(): Promise<HttpTypes.AllEarlyWithdrawPenaltiesResponse> {
        const url = api.rpc.general.allEarlyWithdrawPenalties;
        const res = await this.httpSvc.get<HttpTypes.AllEarlyWithdrawPenaltiesResponse>(url);
        return res;

        // const mapp: Record<string, string> = {};

        // const penalties: Record<string, string> = {};

        // for (const key in penaltiesRes) {
        //     const withdrawTime = parseInt(key);
        //     const penalty = penaltiesRes[key];
        //     penalties[withdrawTime] = penalty;
        // }
    }

    public async getWithdrawalOrder(withdrawalHash: Uint8Array): Promise<any> {
        const url = api.rpc.general.withdrawalOrder.replace(
            ':withdrawalHash',
            bytesToHex(withdrawalHash)
        );

        const res = await this.httpSvc.get<HttpTypes.WithdrawalOrderResponse>(url);

        if (!res.withdrawalOrderFound) return null;

        return res.withdrawalOrder;
    }

    // #endregio

    // #region block

    public async getBlocksCount(): Promise<number> {
        const url = api.rpc.block.blocksCount;
        const res = await this.httpSvc.get<HttpTypes.BlocksCountResponse>(url);
        return res.blocksCount;
    }

    public async getMaxBlockSize(): Promise<number> {
        const url = api.rpc.block.maxBlockSize;
        const res = await this.httpSvc.get<HttpTypes.MaxBlockResponse>(url);
        return res.maxBlockSize;
    }

    public async getMaxTransactionSize(): Promise<number> {
        const url = api.rpc.block.maxTransactionSize;
        const res = await this.httpSvc.get<HttpTypes.MaxTransactionSizeResponse>(url);
        return res.maxTransactionSize;
    }

    public async getBlockNumber(): Promise<number> {
        const url = api.rpc.block.blockNumber;
        const res = await this.httpSvc.get<HttpTypes.BlockNumberResponse>(url);
        return res.blockNumber;
    }

    public async getBlockTimestamp(): Promise<number> {
        const url = api.rpc.block.blockTimestamp;
        const res = await this.httpSvc.get<HttpTypes.BLockTimestampResponse>(url);
        return res.blockTimestamp;
    }

    public async getLatestBlockNumber(): Promise<number> {
        const blocksCouunt = await this.getBlocksCount();
        return blocksCouunt - 1;
    }

    public async getBlockByNumber(blockNumber: number): Promise<Block> {
        const url = api.rpc.block.block.replace(':blockNumber', blockNumber.toString());
        const res = await this.httpSvc.get<HttpTypes.BlockResponse>(url);
        return res.block;
    }

    public async getBlockWithViDataTransactionsOnly(
        blockNumber: number,
        vidaId: number
    ): Promise<Block> {
        const url = api.rpc.block.blockWithVidaDataTransactionsOnly
            .replace(':blockNumber', blockNumber.toString())
            .replace(':vidaId', vidaId.toString());

        const res = await this.httpSvc.get<HttpTypes.BlockWithVidaTransactionsOnly>(url);

        return res.block;
    }

    // #endregion

    // #region transactions
    public async getTransactionByHash(hash: string): Promise<AnyFalconTransaction> {
        const url = api.rpc.transactions.transactionByHash.replace(':transactionHash', hash);
        const res = await this.httpSvc.get<HttpTypes.TransactionByHashResponse>(url);
        return res.transaction;
    }

    public async getTransactionsByHashes(hashes: string[]): Promise<AnyFalconTransaction[]> {
        const data = {
            transactionHashes: hashes,
        };

        const res = await this.httpSvc.post<HttpTypes.TransactionsByHashesResponse>(
            api.rpc.transactions.transactionsByHashes,
            data
        );

        return res.transactions;
    }

    // #endregion

    // #region proposal

    public async getProposalFee(): Promise<number> {
        const url = api.rpc.proposals.proposalFee;
        const res = await this.httpSvc.get<HttpTypes.ProposalFeeResponse>(url);
        return res.proposalFee;
    }

    public async getProposalValidityTime(): Promise<number> {
        const url = api.rpc.proposals.proposalValidityTime;
        const res = await this.httpSvc.get<HttpTypes.ProposalValidityTimeResponse>(url);
        return res.proposalValidityTime;
    }

    public async getProposalStatus(hash: string): Promise<string> {
        const url = api.rpc.proposals.proposalStatus.replace(':proposalHash', hash);

        const res = await this.httpSvc.get<HttpTypes.ProposalStatusResponse>(url);

        return res.status;
    }

    // #endregion

    // #region validators

    public async getValidatorCountLimit(): Promise<number> {
        const url = api.rpc.validators.validatorCountLimit;
        const res = await this.httpSvc.get<HttpTypes.ValidatorCountResponse>(url);
        return res.validatorCountLimit;
    }

    public async getValidatorSlashingFee(): Promise<number> {
        const url = api.rpc.validators.validatorSlashingFee;
        const res = await this.httpSvc.get<HttpTypes.ValidatorSlashingFeeResponse>(url);
        return res.validatorSlashingFee;
    }

    public async getValidatorOperationalFee(): Promise<number> {
        const url = api.rpc.validators.validatorOperationalFee;
        const res = await this.httpSvc.get<HttpTypes.ValidatorOperationalFeeResponse>(url);
        return res.validatorOperationalFee;
    }

    public async getValidatorJoiningFee() {
        const url = api.rpc.validators.validatorJoiningFee;
        const res = await this.httpSvc.get<HttpTypes.ValidatorJoiningFeeResponse>(url);
        return res.validatorJoiningFee;
    }

    public async getMinimumDelegatingAmount() {
        const url = api.rpc.validators.minimumDelegatingAmount;
        const res = await this.httpSvc.get<HttpTypes.MinimunDelegatingAmountResponse>(url);
        return res.minimumDelegatingAmount;
    }

    public async getTotalValidatorsCount(): Promise<number> {
        const url = api.rpc.validators.totalValidatorsCount;
        const res = await this.httpSvc.get<HttpTypes.TotalValidatorCountResponse>(url);
        return res.validatorsCount;
    }

    public async getStandbyValidatorsCount(): Promise<number> {
        const url = api.rpc.validators.standbyValidatorsCount;
        const res = await this.httpSvc.get<HttpTypes.StandbyValidatorCountResponse>(url);
        return res.validatorsCount;
    }

    public async getActiveValidatorsCount(): Promise<number> {
        const url = api.rpc.validators.activeValidatorsCount;
        const res = await this.httpSvc.get<HttpTypes.ActiveValidatorCountResponse>(url);
        return res.validatorsCount;
    }

    public async getTotalDelegatorsCount(): Promise<number> {
        const url = api.rpc.validators.totalDelegatorsCount;
        const res = await this.httpSvc.get<HttpTypes.DelegatorsCountResponse>(url);
        return res.delegatorsCount;
    }

    public async getAllValidators(): Promise<Validator[]> {
        const url = api.rpc.validators.allValidators;
        const res = await this.httpSvc.get<HttpTypes.AllValidatorsResponse>(url);

        const validators = res.validators;

        return res.validators;
    }

    public async getStandbyValidators(): Promise<Validator[]> {
        const url = api.rpc.validators.standbyValidators;
        const res = await this.httpSvc.get<HttpTypes.AllStandByValidatorsResponse>(url);
        return res.validators;
    }

    public async getActiveValidators(): Promise<Validator[]> {
        const url = api.rpc.validators.activeValidators;
        const res = await this.httpSvc.get<HttpTypes.AllActiveValidatorsResponse>(url);
        return res.validators;
    }

    public async getValidator(address: string): Promise<Validator> {
        const url = api.rpc.validators.validator.replace(':validatorAddress', address);
        const res = await this.httpSvc.get<HttpTypes.validatorResponse>(url);
        return res.validator;
    }

    public async getDelegatees(address: string): Promise<Validator[]> {
        const url = api.rpc.validators.delegateesOfUser.replace(':userAddress', address);
        const res = await this.httpSvc.get<HttpTypes.allDelegateesOfUserResponse>(url);

        const validatorsData = res.delegatees;
        const validatorsList = [];

        for (let i = 0; i < validatorsData.length; i++) {
            const v = validatorsData[i];

            // prettier-ignore
            const validator = {
                address: v.hasOwnProperty('address') ? v.address : '0x',
                ip: v.hasOwnProperty('ip') ? v.ip : '',
                isBadActor: v.hasOwnProperty('badActor') ? v.badActor : false,
                votingPower: v.hasOwnProperty('votingPower') ? v.votingPower : 0,
                shares: v.hasOwnProperty('totalShares') ? v.totalShares : 0,
                delegatorsCount: v.hasOwnProperty('delegatorsCount') ? v.delegatorsCount : 0,
                status: v.hasOwnProperty('status') ? v.status : 'unknown',
            }

            validatorsList.push(validator);
        }

        return validatorsList;
    }

    // prettier-ignore
    public async getDelegatedPWR(delegatorAddress: string, validatorAddress: string): Promise<bigint> {
        const url = api.rpc.validators.delegatedPwr
            .replace(':userAddress', delegatorAddress)
            .replace(':validatorAddress', validatorAddress);
        
        const res = await this.httpSvc.get<HttpTypes.DelegatedPwrResponse>(url);
        return res.delegatedPWR;
    }

    // prettier-ignore
    public async getSharesOfDelegator(delegatorAddress: string, validatorAddress: string): Promise<number> {
        
        const url = api.rpc.validators.sharesOfDelegator
            .replace(':userAddress', delegatorAddress)
            .replace(':validatorAddress', validatorAddress);

        const res = await this.httpSvc.get<HttpTypes.SharesOfDelegatorResponse>(url);
        return res.shares;
    }

    public async getShareValue(validator: string): Promise<bigint> {
        const url = api.rpc.validators.shareValue.replace(':validatorAddress', validator);
        const res = await this.httpSvc.get<HttpTypes.ShareValueResponse>(url);
        return res.shareValue;
    }

    // #endregion

    // #region vidas

    public async getVidaOwnerTransactionFeeShare() {
        const url = api.rpc.vida.vidaOwnerTransactionFeeShare;
        const res = await this.httpSvc.get<HttpTypes.vidaOwnerTransactionFeeShareResponse>(url);
        return res.vmOwnerTransactionFeeShare;
    }

    public async getVidaIdClaimingFee() {
        const url = api.rpc.vida.vidaIdClaimingFee;
        const res = await this.httpSvc.get<HttpTypes.vidaClaimingFeeResponse>(url);
        return res.vidaIdClaimingFee;
    }

    public async getVidaDataTransactions(
        startingBlock: string,
        endingBlock: string,
        vidaId: bigint
    ): Promise<VmDataTransaction[]> {
        const url = api.rpc.vida.vidaDataTransactions
            .replace(':startingBlock', startingBlock)
            .replace(':endingBlock', endingBlock)
            .replace(':vidaId', vidaId.toString());

        const res = await this.httpSvc.get<HttpTypes.VidaDataTransactionsResponse>(url);

        return res.transactions;
    }

    public async getVidaDataTransactionsFilterByBytePrefix(
        startingBlock: string,
        endingBlock: string,
        vidaId: bigint,
        bytePrefix: Uint8Array
    ): Promise<VmDataTransaction[]> {
        const url = api.rpc.vida.vidaDataTransactions
            .replace(':startingBlock', startingBlock)
            .replace(':endingBlock', endingBlock)
            .replace(':vidaId', vidaId.toString())
            .replace(':bytePrefix', bytesToHex(bytePrefix));

        const res = await this.httpSvc.get<HttpTypes.VidaDataTransactionsFilteredResponse>(url);

        return res.transactions;
    }

    // static async getVMDataTransactionsFiltered() {}

    public getVidaIdAddressBytes(vidaId: bigint): Uint8Array {
        const addressHex = this.getVidaIdAddress(vidaId).substring(2);
        return hexToBytes(addressHex);
    }

    public getVidaIdAddress(vidaId: bigint): string {
        let hexAddress: string = vidaId >= 0 ? '1' : '0';

        if (vidaId < 0) vidaId = -vidaId;

        const vmIdString: string = vidaId.toString();

        for (let i = 0; i < 39 - vmIdString.length; i++) {
            hexAddress += '0';
        }

        hexAddress += vmIdString;

        return '0x' + hexAddress;
    }

    public static isVidaAddress(address: string): boolean {
        if (address == null || (address.length !== 40 && address.length !== 42)) {
            return false;
        }

        if (address.startsWith('0x')) {
            address = address.substring(2);
        }

        if (!address.startsWith('0') && !address.startsWith('1')) {
            return false;
        }

        const negative = address.startsWith('0');
        if (!negative) {
            address = address.substring(1);
        }

        const maxLong = BigInt('9223372036854775807');
        const minLong = BigInt('-9223372036854775808');

        let vmId;
        try {
            vmId = BigInt(address);
            if (negative) {
                vmId = -vmId;
            }
        } catch (error) {
            return false;
        }

        if (vmId > maxLong || vmId < minLong) {
            return false;
        }

        return true;
    }

    public async getOwnerOfVida(vidaId: bigint): Promise<string | null> {
        const url = api.rpc.vida.ownerOfVida.replace(':vidaId', vidaId.toString());
        const res = await this.httpSvc.get<HttpTypes.OwrnerOfVidaResponse>(url);
        if (res.hasOwnProperty('claimed')) {
            return res.owner;
        }
        return null;
    }

    public async getVidaSponsoredAddresses(vidaID: bigint): Promise<string[]> {
        const url = api.rpc.vida.sponsoredAddresses.replace(':vidaId', vidaID.toString());
        const res = await this.httpSvc.get<HttpTypes.SponsoredAddressResponse>(url);
        return res.sponsoredAddresses;
    }

    public async getVidaAllowedSenders(vidaId: bigint): Promise<string[]> {
        const url = api.rpc.vida.allowedSenders.replace(':vidaId', vidaId.toString());
        const res = await this.httpSvc.get<HttpTypes.VidaAllowedSendersResponse>(url);
        return res.allowedSenders;
    }

    public async isVidaPrivate(vidaId: bigint): Promise<boolean> {
        const url = api.rpc.vida.isVidaPrivate.replace(':vidaId', vidaId.toString());
        const res = await this.httpSvc.get<HttpTypes.IsVidaPrivateResponse>(url);
        return res.isPrivate;
    }

    public async getConduitsOfVida(vidaId: bigint): Promise<Validator[]> {
        const url = api.rpc.vida.conduitsOfVida.replace(':vidaId', vidaId.toString());
        const res = await this.httpSvc.get<HttpTypes.ConduitsOfVidaResponse>(url);

        const validatorsData = res.conduits;
        const validatorsList = [];

        for (let i = 0; i < validatorsData.length; i++) {
            const v = validatorsData[i];

            // prettier-ignore
            const validator = {
                address: v.address,
                ip: v.ip,
                isBadActor: v.hasOwnProperty('badActor') ? v.isBadActor : false,
                votingPower: v.hasOwnProperty('votingPower') ? v.votingPower : 0,
                shares: v.hasOwnProperty('totalShares') ? v.totalShares : 0,
                delegatorsCount: v.hasOwnProperty('delegatorsCount') ? v.delegatorsCount : 0,
                status: null,
            };

            validatorsList.push(validator);
        }

        return validatorsList;
    }

    public async isOwnerAllowedToTransferPWRFromVida(vidaId: bigint): Promise<boolean> {
        const url = api.rpc.vida.isOwnerAllowedToTransferPWRFromVida.replace(
            ':vidaId',
            vidaId.toString()
        );
        const res = await this.httpSvc.get<HttpTypes.IsOwnerAllowedToTransferPWRFromVidaResponse>(
            url
        );

        return res.allowed;
    }

    public async areConduitsAllowedToTransferPWRFromVida(vidaId: bigint): Promise<boolean> {
        const url = api.rpc.vida.areConduitsAllowedToTransferPWRFromVida.replace(
            ':vidaId',
            vidaId.toString()
        );

        const res =
            await this.httpSvc.get<HttpTypes.AreConduitsAllowedToTransferPWRFromVidaResponse>(url);

        return res.allowed;
    }

    // #endregion

    // #region guardian

    public async getMaxGuardianTime() {
        const url = api.rpc.guardians.maxGuardianTime;
        const res = await this.httpSvc.get<HttpTypes.MaxGuardianTimeResponse>(url);
        return res.maxGuardianTime;
    }

    public async isTransactionValidForGuardianApproval(transaction: string) {
        const url = api.rpc.guardians.isTransactionValidForGuardianApproval;

        const data = { transaction };

        const res =
            await this.httpSvc.post<HttpTypes.IsTransactionValidForGuardianApprovalResponse>(
                url,
                data
            );

        if (res.valid) {
            return {
                valid: res.valid,
                guardianAddress: `0x${res.guardian}`,
                // transaction: res.transaction,
            };
        } else {
            return {
                valid: res.valid,
                // errorMesage: res.error,
                transaction: null,
                guardianAddress: `0x${res.guardian}`,
            };
        }
    }

    public async isTransactionValidForGuardianApprovalBytes(transaction: Uint8Array) {
        return this.isTransactionValidForGuardianApproval(bytesToHex(transaction));
    }

    public async getGuardianOfAddress(
        address: string
    ): Promise<{ guardian: string; expiryDate: EpochTimeStamp } | null> {
        const url = api.rpc.guardians.guardianOfAddress.replace(':address', address);
        const res = await this.httpSvc.get<HttpTypes.GuardianResponse>(url);

        if (res.isGuarded) {
            return {
                guardian: res.guardian,
                expiryDate: res.expiryDate,
            };
        } else return null;
    }

    // #endregion

    // #region iva
    subscribeToVidaTransactions(
        pwrj: PWRJS,
        vmId: bigint,
        startingBlock: bigint,
        handler: ProcessVidaTransactions,
        pollInterval: number = 100
    ): VidaTransactionSubscription {
        const subscription = new VidaTransactionSubscription(
            pwrj,
            vmId,
            startingBlock,
            handler,
            pollInterval
        );
        subscription.start(); // Start the subscription asynchronously
        return subscription;
    }
    // #endregion

    public async broadcastTxn(txnBytes: Uint8Array): Promise<any[]> {
        const txnHex = Buffer.from(txnBytes).toString('hex');

        const url = `${this.rpcNodeUrl}/broadcast/`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({ txn: txnHex, transaction: txnHex }),
        });

        const data = await res.json();

        return data;
    }
}
