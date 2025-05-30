import BigNumber from 'bignumber.js';
import { getConnection } from './connection';
import HttpService from '../services/http.service';
import { TransactionResponse } from './wallet.types';

export default class BrowserWallet {
    private chainId: number = 0;

    private s_httpSvc = new HttpService('https://pwrrpc.pwrlabs.io');

    constructor() { }

    // *~~*~~*~~ GETTERS *~~*~~*~~ //

    async getAddress(): Promise<string> {
        const connection = await getConnection();
        return connection;
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
    async transferPWR(to: string, amount: string): Promise<TransactionResponse | string> {
        try {
            const sender = await getConnection();

            const res = await window.pwr.transferPwr({ from: sender, to: to, amount: amount });
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async sendVidaData(vidaId: string, data: Uint8Array): Promise<TransactionResponse | string>;
    async sendVidaData(vidaId: string, data: Uint8Array): Promise<TransactionResponse | string> {
        try {
            const res = await this.sendPayableVidaData(vidaId, data, '0');
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async sendPayableVidaData(vidaId: string, data: Uint8Array, amount: string): Promise<TransactionResponse | string>;
    async sendPayableVidaData(vidaId: string, data: Uint8Array, amount: string): Promise<TransactionResponse | string> {
        try {
            const sender = await getConnection();

            const res = await window.pwr.payableVidaDataTransaction(
                { from: sender, vidaId: vidaId, amount: amount, data: data }
            );
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async claimVidaId(vidaId: string): Promise<TransactionResponse | string>;
    async claimVidaId(vidaId: string): Promise<TransactionResponse | string> {
        try {
            const sender = await getConnection();

            const res = await window.pwr.claimVidaId({ from: sender, vidaId: vidaId });
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async delegate(validator: string, amount: string): Promise<TransactionResponse | string>;
    async delegate(validator: string, amount: string): Promise<TransactionResponse | string> {
        try {
            const sender = await getConnection();

            const res = await window.pwr.delegate({ from: sender, to: validator, amount: amount });
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async withdraw(validator: string, sharesAmount: string): Promise<TransactionResponse | string>;
    async withdraw(
        validator: string,
        sharesAmount: string
    ): Promise<TransactionResponse | string> {
        try {
            const sender = await getConnection();

            const res = await window.pwr.withdraw({ validator: validator, shares: sharesAmount, from: sender });
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async moveStake(shareAmount: string, fromValidator: string, toValidator: string): Promise<TransactionResponse | string>;
    async moveStake(shareAmount: string, fromValidator: string, toValidator: string): Promise<TransactionResponse | string> {
        try {
            const sender = await getConnection();

            const res = await window.pwr.moveStake({ from: sender, sharesAmount: shareAmount, fromValidator: fromValidator, toValidator: toValidator });
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    // #region proposals

    async proposeChangeEarlyWithdrawPenalty(withdrawlPenaltyTime: string, withdrawalPenalty: number, title: string, description: string): Promise<TransactionResponse | string>;
    async proposeChangeEarlyWithdrawPenalty(withdrawlPenaltyTime: string, withdrawalPenalty: number, title: string, description: string): Promise<TransactionResponse | string> {
        try {
            const sender = await getConnection();

            const res = await window.pwr.proposeEarlyWithdrawPenalty({ 
                from: sender, 
                title: title, 
                description: description, 
                withdrawalPenalty: withdrawalPenalty, 
                earlyWithdrawTime: withdrawlPenaltyTime 
            });
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async proposeChangeFeePerByte(feePerByte: string, title: string, description: string): Promise<TransactionResponse | string>;
    async proposeChangeFeePerByte(feePerByte: string, title: string, description: string): Promise<TransactionResponse | string> {
        try {
            const sender = await getConnection();

            const res = await window.pwr.proposeChangefeePerByte({ 
                from: sender, feePerByte: feePerByte, title: title, description: description,
            });
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async proposeChangeMaxBlockSize(maxBlockSize: number, title: string, description: string): Promise<TransactionResponse | string>;
    async proposeChangeMaxBlockSize(maxBlockSize: number, title: string, description: string): Promise<TransactionResponse | string> {
        try {
            const sender = await getConnection();

            const res = await window.pwr.maxBlockSize({ 
                from: sender, title: title, description: description, maxBlockSize: maxBlockSize
            });

            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async proposeChangeOverallBurnPercentage( burnPercentage: number,  title: string,  description: string): Promise<TransactionResponse | string>;
    async proposeChangeOverallBurnPercentage( burnPercentage: number,  title: string,  description: string): Promise<TransactionResponse | string> {
        try {
            const sender = await getConnection();

            const res = await window.pwr.overallBurnPercentage({ 
                from: sender, title: title, description: description, burnPercentage: burnPercentage
            });
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async proposeChangeRewardPerYear(rewardPerYear: string, title: string,  description: string): Promise<TransactionResponse | string>;
    async proposeChangeRewardPerYear(rewardPerYear: string, title: string,  description: string): Promise<TransactionResponse | string> {
        try {
            const sender = await getConnection();

            const res = await window.pwr.rewardPerYear({ 
                from: sender, title: title, description: description, rewardPerYear: rewardPerYear
            });
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async proposeChangeValidatorCountLimit(validatorCountLimit: number, title: string,  description: string): Promise<TransactionResponse | string>;
    async proposeChangeValidatorCountLimit(validatorCountLimit: number, title: string,  description: string): Promise<TransactionResponse | string> {
        try {
            const sender = await getConnection();

            const res = await window.pwr.validatorCountLimit({ 
                from: sender, title: title, description: description, validatorCountLimit: validatorCountLimit
            });
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async proposeChangeValidatorJoiningFee( joiningFee: string,  title: string,  description: string): Promise<TransactionResponse | string>;
    async proposeChangeValidatorJoiningFee( joiningFee: string,  title: string,  description: string): Promise<TransactionResponse | string> {
        try {
            const sender = await getConnection();

            const res = await window.pwr.validatorJoiningFee({ 
                from: sender, title: title, description: description, joiningFee: joiningFee
            });
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async proposeChangeVidaIdClaimingFee(claimingFee: string , title: string, description: string): Promise<TransactionResponse | string>;
    async proposeChangeVidaIdClaimingFee(claimingFee: string , title: string, description: string): Promise<TransactionResponse | string> {
        try {
            const sender = await getConnection();

            const res = await window.pwr.vmIdClaimingFee({ 
                from: sender, title: title, description: description, claimingFee: claimingFee
            });
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async proposeOther( title: string,  description: string): Promise<TransactionResponse | string>;
    async proposeOther( title: string,  description: string): Promise<TransactionResponse | string> {
        try {
            const sender = await getConnection();

            const res = await window.pwr.otherProposal({ 
                from: sender, title: title, description: description,
            });
            return res;
        } catch (err) {
            console.error(err);
        }
    }
    // #endregion
}
