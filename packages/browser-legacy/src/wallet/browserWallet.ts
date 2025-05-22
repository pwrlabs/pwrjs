/* prettier-ignore */

import BigNumber from 'bignumber.js';
import { getConnection } from './connection';

import HttpService from '../services/http.service';
import { TransactionResponse } from './wallet.types';


export default class BrowserWallet {
    private chainId: number = 0;

    private s_httpSvc = new HttpService('https://pwrrpc.pwrlabs.io');

    constructor() { }

    // *~~*~~*~~ GETTERS *~~*~~*~~ //

    async getPrivateKey(): Promise<string> {
        const connection = await getConnection();
        return connection.privateKey;
    }

    async getPublicKey(): Promise<string> {
        const connection = await getConnection();
        return connection.publicKey;
    }

    async getAddress(): Promise<string> {
        const connection = await getConnection();
        return connection.address;
    }

    async getBalance(): Promise<bigint> {
        const address = await this.getAddress();
        const res = await this.s_httpSvc.get<{ balance: bigint }>(
            `/balanceOf/?userAddress=${address}`
        );

        return res.balance;
    }

    async getNonce(): Promise<number> {
        const address = await this.getAddress();
        const res = await this.s_httpSvc.get<{ nonce: number }>(
            `/nonceOfUser/?userAddress=${address}`
        );

        return res.nonce;
    }

    async calculateTransactionFee(txnBytes: Uint8Array): Promise<BigNumber> {
        const txnSize = txnBytes.length;
        const feePerByte = new BigNumber(1000);
        const txnFeeInUnits = new BigNumber(txnSize).multipliedBy(feePerByte);

        const txnFeeInPWR = txnFeeInUnits.dividedBy(
            new BigNumber(1_000_000_000)
        );

        return txnFeeInPWR;
    }

    // *~~*~~*~~ TRANSACTIONS *~~*~~*~~ //
    // #region basic transactions
    getChainId() {
        return this.chainId;
    }
    setChainId(chainId: number) {
        this.chainId = chainId;
    }

    async transferPWR(to: string, amount: string): Promise<TransactionResponse | string>;
    // prettier-ignore
    async transferPWR(to: string, amount: string): Promise<TransactionResponse | string> {
        try {
            const sender = (await getConnection()).address;
            console.log(await getConnection())

            const res = await window.pwr.transferPwr({ from: sender, to: to, amount: amount });
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async sendVMDataTxn(vmId: string, data: Uint8Array): Promise<TransactionResponse | string>;
    // prettier-ignore
    async sendVMDataTxn(vmId: string, data: Uint8Array): Promise<TransactionResponse | string> {
        try {
            const sender = (await getConnection()).address;

            const res = await window.pwr.bytesDataTransaction({ from: sender, vmId: vmId, data: data });
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async sendPayableVmDataTransaction(vmId: string, value: string, data: Uint8Array): Promise<TransactionResponse | string>;
    // prettier-ignore
    async sendPayableVmDataTransaction(vmId: string, value: string, data: Uint8Array): Promise<TransactionResponse | string> {
        try {
            const sender = (await getConnection()).address;

            const res = await window.pwr.payableVmDataTransaction(
                { from: sender, vmId: vmId, value: value, data: data }
            );
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async claimVmId(vmId: string): Promise<TransactionResponse | string>;
    async claimVmId(vmId: string): Promise<TransactionResponse | string> {
        try {
            const sender = (await getConnection()).address;

            const res = await window.pwr.claimIdVm({ from: sender, vmId: vmId });
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async delegate(to: string, amount: string): Promise<TransactionResponse | string>;
    // prettier-ignore
    async delegate(to: string, amount: string): Promise<TransactionResponse | string> {
        try {
            const sender = (await getConnection()).address;

            const res = await window.pwr.delegate({ from: sender, to: to, amount: amount });
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async withdraw(from: string, sharesAmount: string): Promise<TransactionResponse | string>;
    async withdraw(
        from: string,
        sharesAmount: string
    ): Promise<TransactionResponse | string> {
        try {
            const sender = (await getConnection()).address;

            const res = await window.pwr.withdraw({ from: from, shares: sharesAmount });
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async moveStake(shareAmount: string, fromValidator: string, toValidator: string): Promise<TransactionResponse | string>;
    // prettier-ignore
    async moveStake(shareAmount: string, fromValidator: string, toValidator: string): Promise<TransactionResponse | string> {
        try {
            const sender = (await getConnection()).address;

            const res = await window.pwr.moveStake({ from: sender, sharesAmount: shareAmount, fromValidator: fromValidator, toValidator: toValidator });
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    // #region proposals

    async createProposal_ChangeEarlyWithdrawalPenalty(withdrawlPenaltyTime: string, withdrawalPenalty: number, title: string, description: string): Promise<TransactionResponse | string>;
    // prettier-ignore
    async createProposal_ChangeEarlyWithdrawalPenalty(withdrawlPenaltyTime: string, withdrawalPenalty: number, title: string, description: string): Promise<TransactionResponse | string> {
        try {
            const sender = (await getConnection()).address;

            const res = await window.pwr.earlyWithdrawPenalty({ 
                from: sender, 
                title: title, 
                description: description, 
                earlyWithdrawPenalty: withdrawalPenalty, 
                earlyWithdrawTime: withdrawlPenaltyTime 
            });
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async createProposal_ChangeFeePerByte(feePerByte: string, title: string, description: string): Promise<TransactionResponse | string>;
    // prettier-ignore
    async createProposal_ChangeFeePerByte(feePerByte: string, title: string, description: string): Promise<TransactionResponse | string> {
        try {
            const sender = (await getConnection()).address;

            const res = await window.pwr.feePerByte({ 
                from: sender, feePerByte: feePerByte, title: title, description: description,
            });
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async createProposal_ChangeMaxBlockSize(maxBlockSize: number, title: string, description: string): Promise<TransactionResponse | string>;
    // prettier-ignore
    async createProposal_ChangeMaxBlockSize(maxBlockSize: number, title: string, description: string): Promise<TransactionResponse | string> {
        try {
            const sender = (await getConnection()).address;

            const res = await window.pwr.maxBlockSize({ 
                from: sender, title: title, description: description, maxBlockSize: maxBlockSize
            });

            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async createProposal_ChangeMaxTxnSizeSize( maxTxnSize: number,  title: string,  description: string): Promise<TransactionResponse | string>;
    // prettier-ignore
    async createProposal_ChangeMaxTxnSizeSize( maxTxnSize: number,  title: string,  description: string): Promise<TransactionResponse | string> {
        try {
            const sender = (await getConnection()).address;

            const res = await window.pwr.maxTransactionSize({ 
                from: sender, title: title, description: description, maxTxnSize: maxTxnSize
            });

            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async createProposal_ChangeOverallBurnPercentage( burnPercentage: number,  title: string,  description: string): Promise<TransactionResponse | string>;
    // prettier-ignore
    async createProposal_ChangeOverallBurnPercentage( burnPercentage: number,  title: string,  description: string): Promise<TransactionResponse | string> {
        try {
            const sender = (await getConnection()).address;

            const res = await window.pwr.overallBurnPercentage({ 
                from: sender, title: title, description: description, overallBurnPercentage: burnPercentage
            });
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async createProposal_ChangeRewardPerYear(rewardPerYear: string, title: string,  description: string): Promise<TransactionResponse | string>;
    // prettier-ignore
    async createProposal_ChangeRewardPerYear(rewardPerYear: string, title: string,  description: string): Promise<TransactionResponse | string> {
        try {
            const sender = (await getConnection()).address;

            const res = await window.pwr.rewardPerYear({ 
                from: sender, title: title, description: description, rewardPerYear: rewardPerYear
            });
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async createProposal_ChangeValidatorCountLimit(validatorCountLimit: number, title: string,  description: string): Promise<TransactionResponse | string>;
    // prettier-ignore
    async createProposal_ChangeValidatorCountLimit(validatorCountLimit: number, title: string,  description: string): Promise<TransactionResponse | string> {
        try {
            const sender = (await getConnection()).address;

            const res = await window.pwr.validatorCountLimit({ 
                from: sender, title: title, description: description, validatorCountLimit: validatorCountLimit
            });
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async createProposal_ChangeValidatorJoiningFee( joiningFee: string,  title: string,  description: string): Promise<TransactionResponse | string>;
    // prettier-ignore
    async createProposal_ChangeValidatorJoiningFee( joiningFee: string,  title: string,  description: string): Promise<TransactionResponse | string> {
        try {
            const sender = (await getConnection()).address;

            const res = await window.pwr.validatorJoiningFee({ 
                from: sender, title: title, description: description, validatorJoiningFee: joiningFee
            });
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async createProposal_ChangeVmIdClaimingFee(claimingFee: string , title: string, description: string): Promise<TransactionResponse | string>;
    // prettier-ignore
    async createProposal_ChangeVmIdClaimingFee(claimingFee: string , title: string, description: string): Promise<TransactionResponse | string> {
        try {
            const sender = (await getConnection()).address;

            const res = await window.pwr.vmIdClaimingFee({ 
                from: sender, title: title, description: description, vmIdClaimingFee: claimingFee
            });
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async createProposal_ChangeVmOwnerTxnFeeShare( feeShare: number,  title: string,  description: string): Promise<TransactionResponse | string>;
    // prettier-ignore
    async createProposal_ChangeVmOwnerTxnFeeShare( feeShare: number,  title: string,  description: string): Promise<TransactionResponse | string> {
        try {
            const sender = (await getConnection()).address;

            const res = await window.pwr.vmOwnerTransactionFeeShare({ 
                from: sender, title: title, description: description, vmOwnerTxnFeeShare: feeShare
            });
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async createProposal_OtherProposal( title: string,  description: string): Promise<TransactionResponse | string>;
    // prettier-ignore
    async createProposal_OtherProposal( title: string,  description: string): Promise<TransactionResponse | string> {
        try {
            const sender = (await getConnection()).address;

            const res = await window.pwr.otherProposal({ 
                from: sender, title: title, description: description,
            });
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async voteProposal( proposalHash: string,  vote: number): Promise<TransactionResponse | string>;
    //prettier-ignore
    async voteProposal( proposalHash: string,  vote: number): Promise<TransactionResponse | string> {
        try {
            const sender = (await getConnection()).address;

            const res = await window.pwr.voteOnProposal({ 
                from: sender, proposalHash: proposalHash, vote: vote
            });
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    // #endregion
}
