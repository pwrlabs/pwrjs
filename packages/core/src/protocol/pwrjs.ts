// third party

import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

import { Block } from '../entities/block.entity';
import { VmDataTransaction } from '../record/vmDataTransaction';
import { Validator } from '../record/validator';
import TransactionDecoder from './transaction-decoder';
import { Transaction_ID } from '../static/enums/transaction.enum';
import HttpService from '../services/http.service';
import {
    ActiveValidatorCountRes,
    AllValidtorsRes,
    DelegatorsCount,
    OwrnerOfVMRes,
    StandbyValidatorCountRes,
    TotalValidatorCountRes,
    VmDataTransactionsRes,
} from '../services/responses';
import { ProcessVidaTransactions, VidaTransactionSubscription } from './vida';

import { HttpTypes } from '../entities/http.types';
import { FalconTransaction } from '../entities/falcon-transaction.entity';

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
        const res = await this.httpSvc.get<HttpTypes.ChainIdResponse>(
            endpoints.pwrrpc.chain_id
        );
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
                const res = await this.httpSvc.get<HttpTypes.ChainIdResponse>(
                    endpoints.pwrrpc.chain_id
                );
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
        const res = await this.httpSvc.get<HttpTypes.FeePerByteResponse>(
            endpoints.pwrrpc.feePerByte
        );
        return res.feePerByte;
    }

    public async getBlockchainVersion(): Promise<number> {
        const res = await this.httpSvc.get<HttpTypes.BLockchainVersionResponse>(
            endpoints.pwrrpc.blockchainVersion
        );
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

            const sizeOfAllTransactions =
                guardianApprovalTransaction.transactions.reduce(
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
        const res = await this.httpSvc.get<HttpTypes.EcsdaFeeRes>(
            endpoints.pwrrpc.ecdsaVerificationFee
        );
        return res.ecdsaVerificationFee;
    }

    // #endregion

    // #region wallet
    public async getPublicKeyOfAddress(
        address: string
    ): Promise<Uint8Array | null> {
        try {
            const res =
                await this.httpSvc.get<HttpTypes.PublicKeyOfAddressResponse>(
                    endpoints.pwrrpc.publicKeyOfAddress.replace(
                        ':address',
                        address
                    )
                );

            const pk = res.falconPublicKey.startsWith('0x')
                ? res.falconPublicKey.substring(2)
                : res.falconPublicKey;

            return hexToBytes(pk);
        } catch {
            return null;
        }
    }

    public async getNonceOfAddress(address: string): Promise<string> {
        const url = endpoints.pwrrpc.nonceOfAddress.replace(
            ':address',
            address
        );
        const res = await this.httpSvc.get<HttpTypes.NonceResponse>(url);
        return res.nonce;
    }

    public async getBalanceOfAddress(address: string): Promise<string> {
        const url = endpoints.pwrrpc.balanceOfAddress.replace(
            ':address',
            address
        );
        const res = await this.httpSvc.get<HttpTypes.BalanceResponse>(url);
        return res.balance;
    }

    // #endregion

    // #region general
    public async getBurnPercentage() {
        const url = endpoints.pwrrpc.burnPercentage;
        const res = await this.httpSvc.get<HttpTypes.BurnPercentageResponse>(
            url
        );

        return res.burnPercentage;
    }

    public async getTotalVotingPower() {
        const url = endpoints.pwrrpc.totalVotingPower;
        const res = await this.httpSvc.get<HttpTypes.TotalVotingPowerResponse>(
            url
        );
        return res.totalVotingPower;
    }

    public async getPwrRewardsPerYear() {
        const url = endpoints.pwrrpc.pwrRewardsPerYear;
        const res = await this.httpSvc.get<HttpTypes.RewardsPerYearResponse>(
            url
        );
        return res.pwrRewardsPerYear;
    }

    public async getWithdrawalLockTime() {
        const url = endpoints.pwrrpc.withdrawalLockTime;
        const res = await this.httpSvc.get<HttpTypes.WithdrawlLockTimeResponse>(
            url
        );
        return res.withdrawalLockTime;
    }

    public async getActiveVotingPower() {
        const rawRes = await fetch(`${this.rpcNodeUrl}/activeVotingPower/`);
        const res = await rawRes.json();

        return res.activeVotingPower;
    }

    public async getEarlyWithdrawPenalty() {
        const url = `/allEarlyWithdrawPenalties/`;
        const res = await this.httpSvc.get<any>(url);

        const penaltiesRes = res.earlyWithdrawPenalties;

        const penalties: Record<string, string> = {};

        for (const key in penaltiesRes) {
            const withdrawTime = parseInt(key);
            const penalty = penaltiesRes[key];
            penalties[withdrawTime] = penalty;
        }

        return penalties;
    }

    // #endregio

    // #region block

    public async getBlocksCount(): Promise<number> {
        const url = endpoints.pwrrpc.blocksCount;
        const res = await this.httpSvc.get<HttpTypes.BlocksCountResponse>(url);
        return res.blocksCount;
    }

    public async getMaxBlockSize(): Promise<number> {
        const url = endpoints.pwrrpc.maxBlockSize;
        const res = await this.httpSvc.get<HttpTypes.MaxBlockResponse>(url);
        return res.maxBlockSize;
    }

    public async getMaxTransactionSize(): Promise<number> {
        const url = endpoints.pwrrpc.maxTransactionSize;
        const res =
            await this.httpSvc.get<HttpTypes.MaxTransactionSizeResponse>(url);
        return res.maxTransactionSize;
    }

    public async getBlockNumber(): Promise<number> {
        const url = endpoints.pwrrpc.blockNumber;
        const res = await this.httpSvc.get<HttpTypes.BlockNumberResponse>(url);
        return res.blockNumber;
    }

    public async getBlockTimestamp(): Promise<number> {
        const url = endpoints.pwrrpc.blockTimestamp;
        const res = await this.httpSvc.get<HttpTypes.BLockTimestampResponse>(
            url
        );
        return res.blockTimestamp;
    }

    public async getLatestBlockNumber(): Promise<number> {
        const blocksCouunt = await this.getBlocksCount();
        return blocksCouunt - 1;
    }

    public async getBlockByNumber(blockNumber: number): Promise<Block> {
        const url = endpoints.pwrrpc.block.replace(
            ':blockNumber',
            blockNumber.toString()
        );
        const res = await this.httpSvc.get<HttpTypes.BlockResponse>(url);
        return res.block;
    }

    public async getBlockByNumberExcludingDataAndExtraData(
        blockNumber: number
    ): Promise<any> {
        const url = endpoints.pwrrpc.blockWithExtactedData.replace(
            ':blockNumber',
            blockNumber.toString()
        );

        const res =
            await this.httpSvc.get<HttpTypes.BlockExcludingDataResponse>(url);

        return res.block;
    }

    public async getBlockWithViDataTransactionsOnly(
        blockNumber: number,
        vidaId: number
    ): Promise<any> {
        const url = endpoints.pwrrpc.blockWithVmDataTransactionsOnly
            .replace(':blockNumber', blockNumber.toString())
            .replace(':vidaId', vidaId.toString());

        const res =
            await this.httpSvc.get<HttpTypes.BlockWithVidaTransactionsOnly>(
                url
            );

        return res.block;
    }

    // #endregion

    // #region transactions
    public async getTransactionByHash(
        hash: string
    ): Promise<FalconTransaction> {
        const url = endpoints.pwrrpc.transactionByHash.replace(
            'transactionHash',
            hash
        );

        const res = await this.httpSvc.get<HttpTypes.TransactionByHashResponse>(
            url
        );

        return res.transaction;
    }

    public async getTransactionsByHashes(
        hashes: string[]
    ): Promise<FalconTransaction[]> {
        const data = {
            transactionHashes: hashes,
        };

        const res =
            await this.httpSvc.post<HttpTypes.TransactionsByHashesResponse>(
                endpoints.pwrrpc.transactionsByHashes,
                data
            );

        return res.transactions;
    }

    // #endregion

    // #region proposal

    public async getProposalFee(): Promise<number> {
        const url = endpoints.pwrrpc.proposalFee;
        const res = await this.httpSvc.get<HttpTypes.ProposalFeeResponse>(url);
        return res.proposalFee;
    }

    public async getProposalValidityTime(): Promise<number> {
        const url = endpoints.pwrrpc.proposalValidityTime;
        const res =
            await this.httpSvc.get<HttpTypes.ProposalValidityTimeResponse>(url);
        return res.proposalValidityTime;
    }

    public async getProposalStatus(hash: string): Promise<string> {
        const url = endpoints.pwrrpc.proposalStatus.replace(
            ':proposalHash',
            hash
        );

        const res = await this.httpSvc.get<HttpTypes.ProposalStatusResponse>(
            url
        );

        return res.status;
    }

    // #endregion

    // #region validators

    public async getValidatorCountLimit(): Promise<number> {
        const url = endpoints.pwrrpc.validatorCountLimit;
        const res = await this.httpSvc.get<HttpTypes.ValidatorCountResponse>(
            url
        );
        return res.validatorCountLimit;
    }

    public async getValidatorSlashingFee(): Promise<number> {
        const url = endpoints.pwrrpc.validatorSlashingFee;
        const res =
            await this.httpSvc.get<HttpTypes.ValidatorSlashingFeeResponse>(url);
        return res.validatorSlashingFee;
    }

    public async getValidatorOperationalFee(): Promise<number> {
        const url = endpoints.pwrrpc.validatorOperationalFee;
        const res =
            await this.httpSvc.get<HttpTypes.ValidatorOperationalFeeResponse>(
                url
            );
        return res.validatorOperationalFee;
    }

    public async getValidatorJoiningFee() {
        const url = endpoints.pwrrpc.validatorJoiningFee;
        const res =
            await this.httpSvc.get<HttpTypes.ValidatorJoiningFeeResponse>(url);
        return res.validatorJoiningFee;
    }

    public async getMinimumDelegatingAmount() {
        const url = endpoints.pwrrpc.minimumDelegatingAmount;
        const res =
            await this.httpSvc.get<HttpTypes.MinimunDelegatingAmountResponse>(
                url
            );
        return res.minimumDelegatingAmount;
    }

    public async getTotalValidatorsCount(): Promise<number> {
        const url = `/totalValidatorsCount/`;
        const res = await this.httpSvc.get<TotalValidatorCountRes>(url);
        return res.validatorsCount;
    }

    public async getStandbyValidatorsCount(): Promise<number> {
        const url = `/standbyValidatorsCount/`;
        const res = await this.httpSvc.get<StandbyValidatorCountRes>(url);
        return res.validatorsCount;
    }

    public async getActiveValidatorsCount(): Promise<number> {
        const url = `/activeValidatorsCount/`;
        const res = await this.httpSvc.get<ActiveValidatorCountRes>(url);
        return res.validatorsCount;
    }

    public async getTotalDelegatorsCount(): Promise<number> {
        const url = `/totalDelegatorsCount/`;
        const res = await this.httpSvc.get<DelegatorsCount>(url);
        return res.delegatorsCount;
    }

    public async getAllValidators(): Promise<Validator[]> {
        const url = `/allValidators/`;
        const res = await this.httpSvc.get<AllValidtorsRes>(url);

        const validators = res.validators;

        const list = [];

        for (let i = 0; i < validators.length; i++) {
            const v = validators[i];

            // prettier-ignore
            const validator = {
                address: v.address,
                ip: v.ip,
                isBadActor: v.hasOwnProperty('badActor') ? v.badActor : false,
                votingPower: v.hasOwnProperty('votingPower') ? v.votingPower : 0,
                shares: v.hasOwnProperty('totalShares') ? v.totalShares : 0,
                delegatorsCount: v.hasOwnProperty('delegatorsCount') ? v.delegatorsCount : 0,
                status: v.hasOwnProperty('status') ? v.status : 'unknown',
            };

            list.push(validator);
        }

        return list;
    }

    public async getStandbyValidators(): Promise<any[]> {
        const url = `/standbyValidators/`;
        const res = await this.httpSvc.get<any>(url);
        const validators = res.validators;

        const list = [];

        for (let i = 0; i < validators.length; i++) {
            const v = validators[i];

            // prettier-ignore
            const validator = {
                address: v.address,
                ip: v.ip,
                isBadActor: v.hasOwnProperty('badActor') ? v.badActor : false,
                votingPower: v.hasOwnProperty('votingPower') ? v.votingPower : 0,
                shares: v.hasOwnProperty('totalShares') ? v.totalShares : 0,
                delegatorsCount: v.hasOwnProperty('delegatorsCount') ? v.delegatorsCount : 0,
                status: 'standby', 
            };

            list.push(validator);
        }

        return list;
    }

    public async getActiveValidators(): Promise<any[]> {
        const url = `/activeValidators/`;
        const res = await this.httpSvc.get<any>(url);

        const validatorsData = res.validators;
        const validatorsList = [];

        for (let i = 0; i < validatorsData.length; i++) {
            const v = validatorsData[i];

            // prettier-ignore
            const validator = {
                address: v.address,
                ip: v.ip,
                isBadActor: v.hasOwnProperty('badActor') ? v.badActor : false,
                votingPower: v.hasOwnProperty('votingPower') ? v.votingPower : 0,
                shares: v.hasOwnProperty('totalShares') ? v.totalShares : 0,
                delegatorsCount: v.hasOwnProperty('delegatorsCount') ? v.delegatorsCount : 0,
                status: 'active', 
            };

            validatorsList.push(validator);
        }

        return validatorsList;
    }

    public async getValidator(address: string): Promise<any> {
        const url = `/validator/?validatorAddress=${address}`;
        const res = await this.httpSvc.get<any>(url);

        const v = res.validator;

        // prettier-ignore
        const validator = {
            address: v.hasOwnProperty('address') ? v.address : '0x',
            ip: v.hasOwnProperty('ip') ? v.ip : '',
            isBadActor: v.hasOwnProperty('badActor') ? v.badActor : false,
            votingPower: v.hasOwnProperty('votingPower') ? v.votingPower : 0,
            shares: v.hasOwnProperty('totalShares') ? v.totalShares : 0,
            delegatorsCount: v.hasOwnProperty('delegatorsCount') ? v.delegatorsCount : 0,
            status: v.hasOwnProperty('status') ? v.status : 'unknown',
        };

        return validator;
    }

    public async getDelegatees(address: string): Promise<Validator[]> {
        const url = `/delegateesOfUser/?userAddress=${address}`;
        const res = await this.httpSvc.get<any>(url);

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
    public async getDelegatedPWR(delegatorAddress: string, validatorAddress: string) {
        const url = `/validator/delegator/delegatedPWROfAddress/?userAddress=${delegatorAddress}&validatorAddress=${validatorAddress}`;
        const res = await this.httpSvc.get<any>(url);
        return res.delegatedPWR;
    }

    // prettier-ignore
    public async getSharesOfDelegator(delegatorAddress: string, validatorAddress: string) {
        const url = `/validator/delegator/sharesOfAddress/?userAddress=${delegatorAddress}&validatorAddress=${validatorAddress}`;
        const res = await this.httpSvc.get<any>(url);
        return res.shares;
    }

    public async getShareValue(validator: string) {
        const url = `/validator/shareValue/?validatorAddress=${validator}`;
        const res = await this.httpSvc.get<any>(url);

        return res.shareValue;
    }

    // #endregion

    // #region vidas

    public async getVidaOwnerTransactionFeeShare() {
        const url = endpoints.pwrrpc.vidaOwnerTransactionFeeShare;
        const res =
            await this.httpSvc.get<HttpTypes.vidaOwnerTransactionFeeShareResponse>(
                url
            );
        return res.vmOwnerTransactionFeeShare;
    }

    public async getVidaIdClaimingFee() {
        const url = endpoints.pwrrpc.vidaIdClaimingFee;
        const res = await this.httpSvc.get<HttpTypes.vidaClaimingFeeResponse>(
            url
        );
        return res.vmIdClaimingFee;
    }

    public async getVidaDataTransactions(
        startingBlock: string,
        endingBlock: string,
        vidaId: bigint
    ): Promise<VmDataTransaction[]> {
        const url = endpoints.pwrrpc.vidaDataTransactions
            .replace(':startingBlock', startingBlock)
            .replace(':endingBlock', endingBlock)
            .replace(':vidaId', vidaId.toString());

        const res = await this.httpSvc.get<HttpTypes.VidaDataTransactionsRes>(
            url
        );

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
        if (
            address == null ||
            (address.length !== 40 && address.length !== 42)
        ) {
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

    public async getOwnerOfVm(vmId: string): Promise<string | null> {
        const url = `/ownerOfVmId/?vmId=${vmId}`;
        const res = await this.httpSvc.get<OwrnerOfVMRes>(url);

        if (res.hasOwnProperty('claimed')) {
            return res.owner;
        }

        return null;
    }

    public async getConduitsOfVm(vmId: string): Promise<Validator[]> {
        const url = `/conduitsOfVm/?vmId=${vmId}`;
        const res = await this.httpSvc.get<any>(url);

        const validatorsData = res.conduits;
        const validatorsList = [];

        for (let i = 0; i < validatorsData.length; i++) {
            const v = validatorsData[i];

            // prettier-ignore
            const validator = {
                address: v.address,
                ip: v.ip,
                isBadActor: v.hasOwnProperty('badActor') ? v.badActor : false,
                votingPower: v.hasOwnProperty('votingPower') ? v.votingPower : 0,
                shares: v.hasOwnProperty('totalShares') ? v.totalShares : 0,
                delegatorsCount: v.hasOwnProperty('delegatorsCount') ? v.delegatorsCount : 0,
                status: null,
            };

            validatorsList.push(validator);
        }

        return validatorsList;
    }

    // #endregion

    // #region guardian

    public async getMaxGuardianTime() {
        const url = endpoints.pwrrpc.maxGuardianTime;
        const res = await this.httpSvc.get<HttpTypes.MaxGuardianTimeResponse>(
            url
        );
        return res.maxGuardianTime;
    }

    public async isTransactionValidForGuardianApproval(transaction: string) {
        const url = `/isTransactionValidForGuardianApproval/`;
        const res = await this.httpSvc.post<any>(url, {
            data: { transaction },
        });

        if (res.valid) {
            return {
                valid: res.valid,
                guardianAddress: `0x${res.guardian}`,
                transaction: res.transaction,
            };
        } else {
            return {
                valid: res.valid,
                errorMesage: res.error,
                transaction: null,
                guardianAddress: `0x${res.guardian}`,
            };
        }
    }

    public async isTransactionValidForGuardianApprovalBytes(
        transaction: Uint8Array
    ) {
        return this.isTransactionValidForGuardianApproval(
            bytesToHex(transaction)
        );
    }

    public async getGuardianOfAddress(
        address: string
    ): Promise<{ guardian: string; expiryDate: EpochTimeStamp } | null> {
        const url = endpoints.pwrrpc.guardianOfAddress.replace(
            ':address',
            address
        );
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
