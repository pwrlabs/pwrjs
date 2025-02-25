import { Block } from '../record/block';
import { VmDataTransaction } from '../record/vmDataTransaction';
import { Validator } from '../record/validator';
import TransactionDecoder from './transaction-decoder';
import { Transaction_ID } from '../static/enums/transaction.enum';
import { bytesToHex } from '../utils';
import HttpService from '../services/http.service';
import {
    ActiveValidatorCountRes,
    AllValidtorsRes,
    BLockTimestamp,
    BLockchainVersionRes,
    BalanceRes,
    BlockNumberRes,
    BlockRes,
    BlocksCountRes,
    BurnPercentageRes,
    ChainRes,
    DelegatorsCount,
    EcsdaFeeRes,
    FeePerByteRes,
    MaxBlockRes,
    MaxGuardianTimeRes,
    MaxTransactionSizeRes,
    MinimunDelegatingAmountRes,
    NonceRes,
    OwrnerOfVMRes,
    ProposalFeeRes,
    ProposalValidityTimeRes,
    RewardsPerYearRes,
    StandbyValidatorCountRes,
    TotalValidatorCountRes,
    TotalVotingPowerRes,
    ValidatorCountRes,
    ValidatorJoiningFeeRes,
    ValidatorOperationalFeeRes,
    ValidatorSlashingFeeRes,
    VmDataTransactionsRes,
    WithdrawlLockTimeRes,
    vmClaimingFeeRes,
    vmOwnerTransactionFeeShareRes,
} from '../services/responses';
import { IvaTransactionHandler, IvaTransactionSubscription } from './iva';

export default class PWRJS {
    // private ecdsaVerificationFee: number = 10000;
    private chainId: number;
    private axios: HttpService;

    // #region constructor

    constructor(private rpcNodeUrl: string) {
        this.axios = new HttpService(rpcNodeUrl);
        try {
            this.fetchChainId().then((chainId) => {
                this.chainId = chainId;
            });
        } catch (error) {
            throw new Error('Failed to get chain ID from the RPC node');
        }
    }

    private async fetchChainId(): Promise<number> {
        const res = await this.axios.get<ChainRes>('/chainId/');
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

    public getChainId(): number {
        return this.chainId;
    }

    public async getFeePerByte(): Promise<number> {
        const res = await this.axios.get<FeePerByteRes>('/feePerByte/');
        return res.feePerByte;
    }

    public async getBlockchainVersion(): Promise<number> {
        const res = await this.axios.get<BLockchainVersionRes>(
            '/blockchainVersion/'
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
        const res = await this.axios.get<EcsdaFeeRes>('/ecdsaVerificationFee/');
        return res.ecdsaVerificationFee;
    }

    // #endregion

    // #region wallet

    public async getNonceOfAddress(address: string): Promise<string> {
        const url = `/nonceOfUser/?userAddress=${address}`;
        const res = await this.axios.get<NonceRes>(url);
        return res.nonce;
    }

    public async getBalanceOfAddress(address: string): Promise<string> {
        const url = `/balanceOf/?userAddress=${address}`;
        const res = await this.axios.get<BalanceRes>(url);
        return res.balance;
    }

    // #endregion

    // #region general
    public async getBurnPercentage() {
        const url = `/burnPercentage/`;
        const res = await this.axios.get<BurnPercentageRes>(url);

        return res.burnPercentage;
    }

    public async getTotalVotingPower() {
        const url = `/totalVotingPower/`;
        const res = await this.axios.get<TotalVotingPowerRes>(url);
        return res.totalVotingPower;
    }

    public async getPwrRewardsPerYear() {
        const url = `/pwrRewardsPerYear/`;
        const res = await this.axios.get<RewardsPerYearRes>(url);
        return res.pwrRewardsPerYear;
    }

    public async getWithdrawalLockTime() {
        const url = `/withdrawalLockTime/`;
        const res = await this.axios.get<WithdrawlLockTimeRes>(url);
        return res.withdrawalLockTime;
    }

    public async getActiveVotingPower() {
        const rawRes = await fetch(`${this.rpcNodeUrl}/activeVotingPower/`);
        const res = await rawRes.json();

        return res.activeVotingPower;
    }

    public async getEarlyWithdrawPenalty() {
        const url = `/allEarlyWithdrawPenalties/`;
        const res = await this.axios.get<any>(url);

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
        const url = `/blocksCount/`;
        const res = await this.axios.get<BlocksCountRes>(url);
        return res.blocksCount;
    }

    public async getMaxBlockSize(): Promise<number> {
        const url = `/maxBlockSize/`;
        const res = await this.axios.get<MaxBlockRes>(url);
        return res.maxBlockSize;
    }

    public async getMaxTransactionSize(): Promise<number> {
        const url = `/maxTransactionSize/`;
        const res = await this.axios.get<MaxTransactionSizeRes>(url);
        return res.maxTransactionSize;
    }

    public async getBlockNumber(): Promise<number> {
        const url = `/blockNumber/`;
        const res = await this.axios.get<BlockNumberRes>(url);
        return res.blockNumber;
    }

    public async getBlockTimestamp(): Promise<number> {
        const url = `/blockTimestamp/`;
        const res = await this.axios.get<BLockTimestamp>(url);
        return res.blockTimestamp;
    }

    public async getLatestBlockNumber(): Promise<number> {
        const blocksCouunt = await this.getBlocksCount();
        return blocksCouunt - 1;
    }

    public async getBlockByNumber(blockNumber: number): Promise<Block> {
        const url = `/block/?blockNumber=${blockNumber}`;
        const res = await this.axios.get<BlockRes>(url);
        return res.block;
    }

    // #endregion

    // #region proposal

    public async getProposalFee() {
        const url = `/proposalFee/`;
        const res = await this.axios.get<ProposalFeeRes>(url);
        return res.proposalFee;
    }

    public async getProposalValidityTime() {
        const url = `/proposalValidityTime/`;
        const res = await this.axios.get<ProposalValidityTimeRes>(url);
        return res.proposalValidityTime;
    }

    // #endregion

    // #region validators

    public async getValidatorCountLimit(): Promise<number> {
        const url = `/validatorCountLimit/`;
        const res = await this.axios.get<ValidatorCountRes>(url);
        return res.validatorCountLimit;
    }

    public async getValidatorSlashingFee(): Promise<number> {
        const url = `/validatorSlashingFee/`;
        const res = await this.axios.get<ValidatorSlashingFeeRes>(url);
        return res.validatorSlashingFee;
    }

    public async getValidatorOperationalFee(): Promise<number> {
        const url = `/validatorOperationalFee/`;
        const res = await this.axios.get<ValidatorOperationalFeeRes>(url);
        return res.validatorOperationalFee;
    }

    public async getValidatorJoiningFee() {
        const url = `/validatorJoiningFee/`;
        const res = await this.axios.get<ValidatorJoiningFeeRes>(url);
        return res.validatorJoiningFee;
    }

    public async getMinimumDelegatingAmount() {
        const url = `/minimumDelegatingAmount/`;
        const res = await this.axios.get<MinimunDelegatingAmountRes>(url);
        return res.minimumDelegatingAmount;
    }

    public async getTotalValidatorsCount(): Promise<number> {
        const url = `/totalValidatorsCount/`;
        const res = await this.axios.get<TotalValidatorCountRes>(url);
        return res.validatorsCount;
    }

    public async getStandbyValidatorsCount(): Promise<number> {
        const url = `/standbyValidatorsCount/`;
        const res = await this.axios.get<StandbyValidatorCountRes>(url);
        return res.validatorsCount;
    }

    public async getActiveValidatorsCount(): Promise<number> {
        const url = `/activeValidatorsCount/`;
        const res = await this.axios.get<ActiveValidatorCountRes>(url);
        return res.validatorsCount;
    }

    public async getTotalDelegatorsCount(): Promise<number> {
        const url = `/totalDelegatorsCount/`;
        const res = await this.axios.get<DelegatorsCount>(url);
        return res.delegatorsCount;
    }

    public async getAllValidators(): Promise<Validator[]> {
        const url = `/allValidators/`;
        const res = await this.axios.get<AllValidtorsRes>(url);

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
        const res = await this.axios.get<any>(url);
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
        const res = await this.axios.get<any>(url);

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
        const res = await this.axios.get<any>(url);

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
        const res = await this.axios.get<any>(url);

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
        const res = await this.axios.get<any>(url);
        return res.delegatedPWR;
    }

    // prettier-ignore
    public async getSharesOfDelegator(delegatorAddress: string, validatorAddress: string) {
        const url = `/validator/delegator/sharesOfAddress/?userAddress=${delegatorAddress}&validatorAddress=${validatorAddress}`;
        const res = await this.axios.get<any>(url);
        return res.shares;
    }

    public async getShareValue(validator: string) {
        const url = `/validator/shareValue/?validatorAddress=${validator}`;
        const res = await this.axios.get<any>(url);

        return res.shareValue;
    }

    // #endregion

    // #region vm

    public async getVmOwnerTransactionFeeShare() {
        const url = `/vmOwnerTransactionFeeShare/`;
        const res = await this.axios.get<vmOwnerTransactionFeeShareRes>(url);
        return res.vmOwnerTransactionFeeShare;
    }

    public async getVmIdClaimingFee() {
        const url = `/vmIdClaimingFee/`;
        const res = await this.axios.get<vmClaimingFeeRes>(url);
        return res.vmIdClaimingFee;
    }

    public async getVMDataTransactions(
        startingBlock: string,
        endingBlock: string,
        vmId: string
    ): Promise<VmDataTransaction[]> {
        const url = `/getVmTransactions/?startingBlock=${startingBlock}&endingBlock=${endingBlock}&vmId=${vmId}`;
        const res = await this.axios.get<VmDataTransactionsRes>(url);

        const transactions: VmDataTransaction[] = res.transactions;
        const txnArray = new Array(transactions.length);

        for (let i = 0; i < transactions.length; i++) {
            const transaction = transactions[i];
            txnArray[i] = transaction;
        }

        return txnArray;
    }

    // static async getVMDataTransactionsFiltered() {}

    public getVmIdAddress(vmId: bigint): string {
        let hexAddress: string = vmId >= 0 ? '1' : '0';

        if (vmId < 0) vmId = -vmId;

        const vmIdString: string = vmId.toString();

        for (let i = 0; i < 39 - vmIdString.length; i++) {
            hexAddress += '0';
        }

        hexAddress += vmIdString;

        return '0x' + hexAddress;
    }

    public static isVmAddress(address: string): boolean {
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
        const res = await this.axios.get<OwrnerOfVMRes>(url);

        if (res.hasOwnProperty('claimed')) {
            return res.owner;
        }

        return null;
    }

    public async getConduitsOfVm(vmId: string): Promise<Validator[]> {
        const url = `/conduitsOfVm/?vmId=${vmId}`;
        const res = await this.axios.get<any>(url);

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
        const url = `/maxGuardianTime/`;
        const res = await this.axios.get<MaxGuardianTimeRes>(url);
        return res.maxGuardianTime;
    }

    public async isTransactionValidForGuardianApproval(transaction: string) {
        const url = `/isTransactionValidForGuardianApproval/`;
        const res = await this.axios.post<any>(url, { data: { transaction } });

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

    public async getGuardianOfAddress(address: string) {
        const url = `/guardianOf/?userAddress=${address}`;
        const res = await this.axios.get<any>(url);

        if (res.isGuarded) {
            return res.guardian;
        }

        return null;
    }

    // #endregion

    // #region iva
    subscribeToIvaTransactions(
        pwrj: PWRJS,
        vmId: bigint,
        startingBlock: bigint,
        handler: IvaTransactionHandler,
        pollInterval: number = 100
    ): IvaTransactionSubscription {
        const subscription = new IvaTransactionSubscription(
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
