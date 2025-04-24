// 3rd party
import { bytesToHex } from '@noble/hashes/utils';

// protocol
import PWRJS from 'src/protocol/pwrjs';

// services
import HttpService from 'src/services/http.service';
import HashService from 'src/services/hash.service';
import StorageService from 'src/services/storage.service';
import BytesService from 'src/services/bytes.service';
import CryptoService from 'src/services/crypto.service';

// utils
import { TransactionResponse } from './wallet.types';
import TransactionBuilder from 'src/protocol/transaction-builder';
import { FalconKeyPair } from 'src/services/falcon/c';

export default class Falcon512Wallet {
    public _addressHex: string;
    private _addressBytes: Uint8Array;
    private _publicKey: Uint8Array;
    private _privateKey: Uint8Array;

    private keypair: FalconKeyPair;

    // services and objects
    private s_httpSvc = new HttpService('');
    private pwrjs: PWRJS;

    // #region instantiate

    constructor(publicKey: Uint8Array, privateKey: Uint8Array, pwr: PWRJS) {
        this._publicKey = publicKey;
        this._privateKey = privateKey;

        this.keypair = {
            pk: publicKey,
            sk: privateKey,
        };

        const hash = HashService.kekak224(publicKey);
        const address = hash.slice(0, 20);
        this._addressBytes = address;
        this._addressHex = '0x' + bytesToHex(address);
        this.pwrjs = pwr;
    }

    static async new(pwr: PWRJS): Promise<Falcon512Wallet> {
        if (typeof window === 'undefined') {
            // node
            const m = await import('src/services/falcon/falcon-node.service');
            const { pk, sk } = await m.default.generateKeyPair();
            return new Falcon512Wallet(pk, sk, pwr);
        } else {
            // browser
            const m = await import('../services/falcon/falcon-browser.service');
            const { pk, sk } = await m.default.generateKeyPair();
            return new Falcon512Wallet(pk, sk, pwr);
        }
    }

    static fromKeys(pwr: PWRJS, publicKey: Uint8Array, privateKey: Uint8Array): Falcon512Wallet {
        return new Falcon512Wallet(publicKey, privateKey, pwr);
    }

    // #endregion

    // #region wallet props

    getKeyPair(): FalconKeyPair {
        return this.keypair;
    }

    getAddress(): string {
        return this._addressHex;
    }

    getAddressBytes(): Uint8Array {
        return this._addressBytes;
    }

    getPublicKey(): Uint8Array {
        return this._publicKey;
    }

    getPrivateKey(): Uint8Array {
        return this._privateKey;
    }

    // #endregion

    // #region wallet api
    async getChainId() {
        return this.pwrjs.getChainId();
    }

    async getNonce(): Promise<number> {
        const nonce = await this.pwrjs.getNonceOfAddress(this._addressHex);
        return nonce;
    }

    async getBalance(): Promise<bigint> {
        const res = await this.pwrjs.getBalanceOfAddress(this._addressHex);
        return res;
    }

    async sign(data: Uint8Array): Promise<Uint8Array> {
        if (typeof window === 'undefined') {
            // node
            const m = await import('src/services/falcon/falcon-node.service');
            return m.default.sign(data, this._privateKey);
        } else {
            // browser
            const m = await import('src/services/falcon/falcon-browser.service');
            return m.default.sign(data, this._privateKey);
        }
    }

    async getSignedTransaction(transaction: Uint8Array): Promise<Uint8Array> {
        const txnHash = HashService.hashTransaction(transaction);
        const signature = await this.sign(txnHash);

        const buffer = new ArrayBuffer(transaction.length + signature.length + 2);
        const view = new DataView(buffer);

        const full = new Uint8Array(buffer);

        // copy txn
        full.set(transaction, 0);

        // copy signature
        full.set(signature, transaction.length);

        // copy length of signature
        view.setUint16(transaction.length + signature.length, signature.length);

        return full;
    }

    async verifySignature(message: Uint8Array, signature: Uint8Array): Promise<boolean> {
        if (typeof window === 'undefined') {
            // node
            const m = await import('src/services/falcon/falcon-node.service');
            return m.default.verify(message, this._publicKey, signature);
        } else {
            // browser
            const m = await import('../services/falcon/falcon-browser.service');
            return m.default.verify(message, this._publicKey, signature);
        }
    }

    // #endregion

    // #region transactions base

    async setPublicKey(publicKey: Uint8Array): Promise<TransactionResponse>;
    // prettier-ignore
    async setPublicKey(publicKey: Uint8Array, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async setPublicKey(publicKey: Uint8Array, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconSetPublicKeyTransaction(
            publicKey,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    async transferPWR(to: string, amount: string): Promise<TransactionResponse>;
    // prettier-ignore
    async transferPWR(to: string, amount: string, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async transferPWR(to: string, amount: string, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();

       
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconTransferPwrTransaction(
            to,
            amount,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // #endregion

    // #region validator transactions

    async joinAsValidator(ip: string): Promise<TransactionResponse>;
    // prettier-ignore
    async joinAsValidator(ip: string, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async joinAsValidator(ip: string, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconJoinAsValidatorTransaction(
            ip,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    async delegate(validator: string, pwrAmount: string): Promise<TransactionResponse>;
    // prettier-ignore
    async delegate(validator: string, pwrAmount: string, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async delegate(validator: string, pwrAmount: string, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconDelegateTransaction(
            validator,
            pwrAmount,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    async changeIp(newIp: string): Promise<TransactionResponse>;
    // prettier-ignore
    async changeIp(newIp: string, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async changeIp(newIp: string, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconChangeIpTransaction(
            newIp,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    async claimActiveNodeSpot(): Promise<TransactionResponse>;
    // prettier-ignore
    async claimActiveNodeSpot(nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async claimActiveNodeSpot(nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconClaimActiveNodeSpotTransaction(
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // prettier-ignore
    async moveStake(sharesAmount: bigint, fromValidator: string, toValidator: string): Promise<TransactionResponse>;
    // prettier-ignore
    async moveStake(sharesAmount: bigint, fromValidator: string, toValidator: string, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async moveStake(sharesAmount: bigint, fromValidator: string, toValidator: string, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconMoveStakeTransaction(
            sharesAmount,
            fromValidator,
            toValidator,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // prettier-ignore
    async removeValidator(validatorAddress: string): Promise<TransactionResponse>;
    // prettier-ignore
    async removeValidator(validatorAddress: string, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async removeValidator(validatorAddress: string, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconRemoveValidatorTransaction(
            validatorAddress,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    async withdraw(sharesAmount: bigint, validator: string): Promise<TransactionResponse>;
    // prettier-ignore
    async withdraw(sharesAmount: bigint, validator: string, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async withdraw(sharesAmount: bigint, validator: string, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconWithdrawTransaction(
            sharesAmount,
            validator,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // #endregion

    // #region vida transactions

    async claimVidaId(vidaId: bigint): Promise<TransactionResponse>;
    // prettier-ignore
    async claimVidaId(vidaId: bigint, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async claimVidaId(vidaId: bigint, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconClaimVidaIdTransaction(
            vidaId,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // prettier-ignore
    async submitPayableVidaData(vidaId: bigint, data: Uint8Array, value: bigint): Promise<TransactionResponse>;
    // prettier-ignore
    async submitPayableVidaData(vidaId: bigint, data: Uint8Array, value: bigint, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async submitPayableVidaData(vidaId: bigint, data: Uint8Array, value: bigint, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconSubmitPayableVidaDataTransaction(
            vidaId,
            data,
            value,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    async sendVmData(vmId: string, data: Uint8Array): Promise<TransactionResponse>;
    // prettier-ignore
    async sendVmData(vmId: string, data: Uint8Array, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async sendVmData(vmId: string, data: Uint8Array, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconVmDataTransaction(
            vmId,
            data,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        const res = await this.signAndSend(txn);
        return res;
    }

    // prettier-ignore
    async addVidaAllowedSenders(vidaID: bigint, allowedSenders: string[]): Promise<TransactionResponse>;
    // prettier-ignore
    async addVidaAllowedSenders(vidaID: bigint, allowedSenders: string[], nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async addVidaAllowedSenders(vidaID: bigint, allowedSenders: string[], nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconAddVidaAllowedSendersTransaction(
            vidaID,
            allowedSenders,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // prettier-ignore
    async addVidaSponsoredAddresses(vidaId: bigint, sponsoredAddresses: string[]): Promise<TransactionResponse>;
    // prettier-ignore
    async addVidaSponsoredAddresses(vidaId: bigint, sponsoredAddresses: string[], nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async addVidaSponsoredAddresses(vidaId: bigint, sponsoredAddresses: string[], nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconAddVidaSponsoredAddressesTransaction(
            vidaId,
            sponsoredAddresses,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // prettier-ignore
    async removeVidaSponsoredAddresses(vidaId: bigint, sponsoredAddresses: string[]): Promise<TransactionResponse>;
    // prettier-ignore
    async removeVidaSponsoredAddresses(vidaId: bigint, sponsoredAddresses: string[], nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async removeVidaSponsoredAddresses(vidaId: bigint, sponsoredAddresses: string[], nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconRemoveVidaSponsoredAddressesTransaction(
            vidaId,
            sponsoredAddresses,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // prettier-ignore
    async removeVidaAllowedSenders(vidaId: bigint, allowedSenders: string[]): Promise<TransactionResponse>;
    // prettier-ignore
    async removeVidaAllowedSenders(vidaId: bigint, allowedSenders: string[], nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async removeVidaAllowedSenders(vidaId: bigint, allowedSenders: string[], nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconRemoveVidaAllowedSendersTransaction(
            vidaId,
            allowedSenders,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // prettier-ignore
    async setVidaPrivateState(vidaId: bigint, privateState: boolean): Promise<TransactionResponse>;
    // prettier-ignore
    async setVidaPrivateState(vidaId: bigint, privateState: boolean, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async setVidaPrivateState(vidaId: bigint, privateState: boolean, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconSetVidaPrivateStateTransaction(
            vidaId,
            privateState,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    async setVidaToAbsolutePublic(vidaId: bigint): Promise<TransactionResponse>;
    // prettier-ignore
    async setVidaToAbsolutePublic(vidaId: bigint, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async setVidaToAbsolutePublic(vidaId: bigint, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconSetVidaToAbsolutePublicTransaction(
            vidaId,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // prettier-ignore
    async setPWRTransferRights(vidaId: bigint, ownerCanTransferPWR: boolean): Promise<TransactionResponse>;
    // prettier-ignore
    async setPWRTransferRights(vidaId: bigint, ownerCanTransferPWR: boolean, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async setPWRTransferRights(vidaId: bigint, ownerCanTransferPWR: boolean, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconSetPWRTransferRightsTransaction(
            vidaId,
            ownerCanTransferPWR,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // prettier-ignore
    async transferPWRFromVida(vidaId: bigint, receiver: string, amount: string): Promise<TransactionResponse>;
    // prettier-ignore
    async transferPWRFromVida(vidaId: bigint, receiver: string, amount: string, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async transferPWRFromVida(vidaId: bigint, receiver: string, amount: string, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconTransferPWRFromVidaTransaction(
            vidaId,
            receiver,
            amount,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // #endregion

    // #region conduits txns
    // prettier-ignore
    async setConduitMode (vidaId: bigint, mode: number, conduitThreshold: number, conduits: Set<string>, conduitsWithVotingPower: Record<string, bigint>): Promise<TransactionResponse>;
    // prettier-ignore
    async setConduitMode (vidaId: bigint, mode: number, conduitThreshold: number, conduits: Set<string>, conduitsWithVotingPower: Record<string, bigint>, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async setConduitMode (vidaId: bigint, mode: number, conduitThreshold: number, conduits: Set<string>, conduitsWithVotingPower: Record<string, bigint>, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconSetConduitModeTransaction(
            vidaId,
            mode,
            conduitThreshold,
            conduits,
            conduitsWithVotingPower,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // prettier-ignore
    async setConduitModeWithVidaBased(vidaId: bigint, mode: number, conduitThreshold: number, conduits: Array<string>, stakingPowers: Array<bigint>): Promise<TransactionResponse>;
    // prettier-ignore
    async setConduitModeWithVidaBased(vidaId: bigint, mode: number, conduitThreshold: number, conduits: Array<string>, stakingPowers: Array<bigint>, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async setConduitModeWithVidaBased(vidaId: bigint, mode: number, conduitThreshold: number, conduits: Array<string>, stakingPowers: Array<bigint>, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconSetConduitModeWithVidaBasedTransaction(
            vidaId,
            mode,
            conduitThreshold,
            conduits,
            stakingPowers,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // prettier-ignore
    async approveAsConduit(vidaId: bigint, wrappedTxns: string[]): Promise<TransactionResponse>;
    // prettier-ignore
    async approveAsConduit(vidaId: bigint, wrappedTxns: string[], nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async approveAsConduit(vidaId: bigint, wrappedTxns: string[], nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconApproveAsConduitTransaction(
            vidaId,
            wrappedTxns,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // prettier-ignore
    async removeConduits(vidaId: bigint, conduits: string[]): Promise<TransactionResponse>;
    // prettier-ignore
    async removeConduits(vidaId: bigint, conduits: string[], nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async removeConduits(vidaId: bigint, conduits: string[], nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconRemoveConduitsTransaction(
            vidaId,
            conduits,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // #endregion

    // #region guardian transactions

    // prettier-ignore
    async approveAsGuardian(wrappedTxns: string[]): Promise<TransactionResponse>;
    // prettier-ignore
    async approveAsGuardian(wrappedTxns: string[], feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async approveAsGuardian(wrappedTxns: string[], feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconApproveAsGuardianTransaction(
            wrappedTxns,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // prettier-ignore
    async removeGuardian(): Promise<TransactionResponse>;
    // prettier-ignore
    async removeGuardian(feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async removeGuardian(feePerByte?: string): Promise<TransactionResponse>{
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconRemoveGuardianTransaction(
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // prettier-ignore
    async setGuardian(expiryDate: EpochTimeStamp, guardianAddress: string[]): Promise<TransactionResponse>;
    // prettier-ignore
    async setGuardian(expiryDate: EpochTimeStamp, guardianAddress: string[], feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async setGuardian(expiryDate: EpochTimeStamp, guardianAddress: string[], feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();

        const txn = TransactionBuilder.getFalconSetGuardianTransaction(
            expiryDate,
            guardianAddress,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // #endregion

    // #region proposal transactions

    // prettier-ignore
    async proposeChangeEarlyWithdrawPenalty(title: string, description: string, earlyWithdrawalTime: EpochTimeStamp, withdrawalPenalty: number): Promise<TransactionResponse>;
    // prettier-ignore
    async proposeChangeEarlyWithdrawPenalty(title: string, description: string, earlyWithdrawalTime: EpochTimeStamp, withdrawalPenalty: number, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async proposeChangeEarlyWithdrawPenalty(title: string, description: string, earlyWithdrawalTime: EpochTimeStamp, withdrawalPenalty: number, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconProposeChangeEarlyWithdrawPenaltyTransaction(
            title,
            description,
            earlyWithdrawalTime,
            withdrawalPenalty,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // prettier-ignore
    async proposeChangeFeePerByte( title: string, description: string, newFeePerByte: bigint): Promise<TransactionResponse>;
    // prettier-ignore
    async proposeChangeFeePerByte(title: string, description: string, newFeePerByte: bigint, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async proposeChangeFeePerByte(title: string, description: string, newFeePerByte: bigint, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconProposeChangeFeePerByteTransaction(
            title,
            description,
            newFeePerByte,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // prettier-ignore
    async proposeChangeMaxBlockSize(title: string, description: string, maxBlockSize: number): Promise<TransactionResponse>;
    // prettier-ignore
    async proposeChangeMaxBlockSize(title: string, description: string, maxBlockSize: number, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async proposeChangeMaxBlockSize(title: string, description: string, maxBlockSize: number, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconProposeChangeMaxBlockSizeTransaction(
            title,
            description,
            maxBlockSize,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // prettier-ignore
    async proposeChangeMaxTxnSize(title: string, description: string, maxTxnSize: number): Promise<TransactionResponse>;
    // prettier-ignore
    async proposeChangeMaxTxnSize(title: string, description: string, maxTxnSize: number, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async proposeChangeMaxTxnSize(title: string, description: string, maxTxnSize: number, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconProposeChangeMaxTxnSizeTransaction(
            title,
            description,
            maxTxnSize,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // prettier-ignore
    async proposeChangeOverallBurnPercentage(title: string, description: string, burnPercentage: number): Promise<TransactionResponse>;
    // prettier-ignore
    async proposeChangeOverallBurnPercentage(title: string, description: string, burnPercentage: number, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async proposeChangeOverallBurnPercentage(title: string, description: string, burnPercentage: number, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconProposeChangeOverallBurnPercentageTransaction(
            title,
            description,
            burnPercentage,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // prettier-ignore
    async proposeChangeRewardPerYear(title: string, description: string, rewardPerYear: bigint): Promise<TransactionResponse>;
    // prettier-ignore
    async proposeChangeRewardPerYear(title: string, description: string, rewardPerYear: bigint, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async proposeChangeRewardPerYear(title: string, description: string, rewardPerYear: bigint, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();

        const txn = TransactionBuilder.getFalconProposeChangeRewardPerYearTransaction(
            title,
            description,
            rewardPerYear,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);

    }

    // prettier-ignore
    async proposeChangeValidatorCountLimit(title: string, description: string, validatorCountLimit: number): Promise<TransactionResponse>;
    // prettier-ignore
    async proposeChangeValidatorCountLimit(title: string, description: string, validatorCountLimit: number, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async proposeChangeValidatorCountLimit(title: string, description: string, validatorCountLimit: number, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconProposeChangeValidatorCountLimitTransaction(
            title,
            description,
            validatorCountLimit,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // prettier-ignore
    async proposeChangeValidatorJoiningFee(title: string, description: string, joiningFee: bigint): Promise<TransactionResponse>;
    // prettier-ignore
    async proposeChangeValidatorJoiningFee(title: string, description: string, joiningFee: bigint, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async proposeChangeValidatorJoiningFee(title: string, description: string, joiningFee: bigint, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconProposeChangeValidatorJoiningFeeTransaction(
            title,
            description,
            joiningFee,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // prettier-ignore
    async proposeChangeVidaIdClaimingFee(title: string, description: string, claimingFee: bigint): Promise<TransactionResponse>;
    // prettier-ignore
    async proposeChangeVidaIdClaimingFee(title: string, description: string, claimingFee: bigint, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async proposeChangeVidaIdClaimingFee(title: string, description: string, claimingFee: bigint, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconProposeChangeVidaIdClaimingFeeTransaction(
            title,
            description,
            claimingFee,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // prettier-ignore
    async proposeChangeVmOwnerTxnFeeShare(title: string, description: string, vmOwnerTxnFeeShare: number): Promise<TransactionResponse>;
    // prettier-ignore
    async proposeChangeVmOwnerTxnFeeShare(title: string, description: string, vmOwnerTxnFeeShare: number, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async proposeChangeVmOwnerTxnFeeShare(title: string, description: string, vmOwnerTxnFeeShare: number, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconProposeChangeVmOwnerTxnFeeShareTransaction(
            title,
            description,
            vmOwnerTxnFeeShare,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // prettier-ignore
    async proposeOther(title: string, description: string): Promise<TransactionResponse>;
    // prettier-ignore
    async proposeOther(title: string, description: string, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async proposeOther(title: string, description: string, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconProposeOtherTransaction(
            title,
            description,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    async voteOnProposal(proposalHash: string, vote: number): Promise<TransactionResponse>;
    // prettier-ignore
    async voteOnProposal(proposalHash: string, vote: number, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async voteOnProposal(proposalHash: string, vote: number, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getFalconVoteOnProposalTransaction(
            proposalHash,
            vote,
            _nonce,
            _chainId,
            this._addressBytes,
            _feePerByte.toString()
        );

        return this.signAndSend(txn);
    }

    // #endregion

    // #region wallet exporting

    async storeWallet(filePath: string): Promise<boolean> {
        try {
            if (typeof window === 'undefined') {
                let buffer = Buffer.alloc(0);

                const pubLengthBuffer = Buffer.alloc(4);
                pubLengthBuffer.writeUInt32BE(this._publicKey.length, 0);
                buffer = Buffer.concat([buffer, pubLengthBuffer, Buffer.from(this._publicKey)]);

                const privLengthBuffer = Buffer.alloc(4);
                privLengthBuffer.writeUInt32BE(this._privateKey.length, 0);
                buffer = Buffer.concat([buffer, privLengthBuffer, Buffer.from(this._privateKey)]);

                const { writeFile } = require('fs/promises') as typeof import('fs/promises');

                await writeFile(filePath, buffer);
                return true;
            } else {
                throw new Error('This method cannot be called on the client-side (browser)');
            }
        } catch (error) {
            throw new Error(`Failed to store wallet: ${error.message}`);
        }
    }

    static async loadWalletNode(pwr: PWRJS, filePath: string): Promise<Falcon512Wallet> {
        try {
            if (typeof window === 'undefined') {
                const { readFile } = require('fs/promises') as typeof import('fs/promises');

                const data = await readFile(filePath);

                if (data.length < 8) throw new Error(`File too small: ${data.length} bytes`);

                let offset = 0;

                const pubLength = data.readUInt32BE(offset);
                offset += 4;
                if (pubLength === 0 || pubLength > 2048)
                    throw new Error(`Invalid public key length: ${pubLength}`);
                if (offset + pubLength > data.length)
                    throw new Error(`File too small for public key of length ${pubLength}`);

                const publicKeyBytes = data.slice(offset, offset + pubLength);
                offset += pubLength;

                if (offset + 4 > data.length)
                    throw new Error('File too small for secret key length');

                const secLength = data.readUInt32BE(offset);
                offset += 4;
                if (secLength === 0 || secLength > 4096)
                    throw new Error(`Invalid secret key length: ${secLength}`);
                if (offset + secLength > data.length)
                    throw new Error(`File too small for secret key of length ${secLength}`);

                const privateKeyBytes = data.slice(offset, offset + secLength);

                return Falcon512Wallet.fromKeys(pwr, publicKeyBytes, privateKeyBytes);
            } else {
                throw new Error('This method cannot be called on the client-side (browser)');
            }
        } catch (error) {
            throw new Error(`Failed to load wallet: ${error.message}`);
        }
    }

    static async loadWalletBrowser(pwr: PWRJS, password: string, file: File) {
        if (typeof window === 'undefined') {
            throw new Error(
                'This method is meant for browser environment, please use loadWallet instead'
            );
        }

        try {
            const bytes = await StorageService.loadBrowser(file);

            const decrypted: Uint8Array = await CryptoService.decryptPrivateKeyBrowser(
                bytes,
                password
            );

            const { pk, sk } = BytesService.arrayBufferToKeypair(decrypted);

            return new Falcon512Wallet(pk, sk, pwr);
        } catch (e) {
            console.error(e);
            throw new Error('Failed to load wallet');
        }
    }

    // #endregion

    // #endregion

    // #region verifies
    private async makeSurePublicKeyIsSet(): Promise<TransactionResponse | null> {
        const nonce = await this.getNonce();

        if (nonce == 0) {
            let tx = this.setPublicKey(this._publicKey);
            return tx;
        } else {
            return null;
        }
    }

    // #endregion

    // #region utils

    private async signAndSend(transaction: Uint8Array): Promise<TransactionResponse> {
        const signedTransaction = await this.getSignedTransaction(transaction); //sign the hash of the data of txn
        const txnHex = bytesToHex(signedTransaction);
        const txnHash = bytesToHex(HashService.hashTransaction(signedTransaction));

        const res = await this.s_httpSvc.broadcastTxn(this.pwrjs.getRpcNodeUrl(), txnHex, txnHash);

        return res;
    }
    // #endregion
}
