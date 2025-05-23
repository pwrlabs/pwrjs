// protocol
import PWRJS from '../protocol/pwrjs';

// services
import HttpService from '../services/http.service';
import HashService from '../services/hash.service';
import StorageService from '../services/storage.service';
import BytesService from '../services/bytes.service';
import CryptoService from '../services/crypto.service';

// utils
import { TransactionResponse } from './wallet.types';
import TransactionBuilder from '../protocol/falcon-transaction-builder';
import { FalconKeyPair } from '../services/falcon-service';
import { bytesToHex, hexToBytes } from '../utils';

export default abstract class AbstractWallet {
    public _addressHex: string;
    protected _addressBytes: Uint8Array;
    protected _publicKey: Uint8Array;
    protected _privateKey: Uint8Array;

    private keypair: FalconKeyPair;

    // services and objects
    private s_httpSvc = new HttpService('');
    private pwrjs: PWRJS;

    // #region instantiate

    constructor(sk: Uint8Array, pk: Uint8Array, pwr: PWRJS) {
        this._publicKey = pk;
        this._privateKey = sk;

        this.keypair = {
            pk,
            sk,
        };

        const hash = HashService.kekak224(pk.slice(1));
        const address = hash.slice(0, 20);
        this._addressBytes = address;
        this._addressHex = '0x' + bytesToHex(address);
        this.pwrjs = pwr;
    }

    static new(pwr: PWRJS): Promise<AbstractWallet> {
        throw new Error('Not implemented. Please implement in subclass.');
    }

    static fromKeys(privateKey: Uint8Array, publicKey: Uint8Array, pwr: PWRJS): AbstractWallet {
        throw new Error('Not implemented. Please implement in subclass.');
    }

    // static async new(pwr: PWRJS): Promise<Falcon512Wallet> {
    //     if (typeof window === 'undefined') {
    //         // node
    //         const m = await import('../services/falcon/falcon-node.service');
    //         const keys = await m.default.generateKeyPair();
    //         return Falcon512Wallet.fromKeys(keys.sk, keys.pk, pwr);
    //     } else {
    //         // browser
    //         const m = await import('../services/falcon/falcon-browser.service');
    //         const keys = await m.default.generateKeyPair();
    //         return Falcon512Wallet.fromKeys(keys.sk, keys.pk, pwr);
    //     }
    // }

    // static fromKeys(privateKey: Uint8Array, publicKey: Uint8Array, pwr: PWRJS): AbstractWallet {
    //     return new AbstractWallet(privateKey, publicKey, pwr);
    // }

    // #endregion

    // #region wallet props

    public getKeyPair(): FalconKeyPair {
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

    // async sign(data: Uint8Array): Promise<Uint8Array> {
    //     if (typeof window === 'undefined') {
    //         // node
    //         const m = await import('../services/falcon/falcon-node.service');
    //         return m.default.sign(data, this._privateKey);
    //     } else {
    //         // browser
    //         const m = await import('../services/falcon/falcon-browser.service');
    //         return m.default.sign(data, this._privateKey);
    //     }
    // }

    abstract sign(data: Uint8Array): Promise<Uint8Array>;

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

    abstract verifySignature(message: Uint8Array, signature: Uint8Array): Promise<boolean>;

    // async verifySignature(message: Uint8Array, signature: Uint8Array): Promise<boolean> {
    //     if (typeof window === 'undefined') {
    //         // node
    //         const m = await import('../services/falcon/falcon-node.service');
    //         return m.default.verify(message, this._publicKey, signature);
    //     } else {
    //         // browser
    //         const m = await import('../services/falcon/falcon-browser.service');
    //         return m.default.verify(message, this._publicKey, signature);
    //     }
    // }

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
        const txn = TransactionBuilder.getSetPublicKeyTransaction(
            publicKey.slice(1),
            _nonce,
            _chainId,
            this._addressBytes,
            BigInt(_feePerByte),
        )

        return this.signAndSend(txn);
    }

    async transferPWR(to: string, amount: bigint): Promise<TransactionResponse>;
    // prettier-ignore
    async transferPWR(to: string, amount: bigint, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async transferPWR(to: string, amount: bigint, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();

        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());


        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getTransferTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            hexToBytes(to),
            amount,
            _nonce,
            _chainId,
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
        const txn = TransactionBuilder.getJoinAsValidatorTransaction(
            ip,
            this._addressBytes,
            _nonce,
            _chainId,
            BigInt(_feePerByte),
        );

        return this.signAndSend(txn);
    }

    async delegate(validator: string, pwrAmount: bigint): Promise<TransactionResponse>;
    // prettier-ignore
    async delegate(validator: string, pwrAmount: bigint, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async delegate(validator: string, pwrAmount: bigint, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getDelegateTransaction(
            hexToBytes(validator),
            pwrAmount,
            _nonce,
            _chainId,
            this._addressBytes,
            BigInt(_feePerByte),
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
            BigInt(_feePerByte),
            this._addressBytes,
            newIp,
            _nonce,
            _chainId,
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
        const txn = TransactionBuilder.getClaimActiveNodeSpotTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            _nonce,
            _chainId
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
        const txn = TransactionBuilder.getMoveStakeTxnTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            sharesAmount,
            hexToBytes(fromValidator),
            hexToBytes(toValidator),
            _nonce,
            _chainId,
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
        const txn = TransactionBuilder.getRemoveValidatorTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            hexToBytes(validatorAddress),
            _nonce,
            _chainId,
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
        const txn = TransactionBuilder.getWithdrawTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            sharesAmount,
            hexToBytes(validator),
            _nonce,
            _chainId,
        )

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
        const txn = TransactionBuilder.getClaimVidaIdTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            vidaId,
            _nonce,
            _chainId,
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
        const txn = TransactionBuilder.getPayableVidaDataTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            vidaId,
            data,
            value,
            _nonce,
            _chainId,
        );

        return this.signAndSend(txn);
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
        const txn = TransactionBuilder.getAddVidaAllowedSendersTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            vidaID,
            new Set(allowedSenders.map((s) => hexToBytes(s))),
            nonce,
            _chainId,
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
        const txn = TransactionBuilder.getAddVidaSponsoredAddressesTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            vidaId,
            new Set(sponsoredAddresses.map((s) => hexToBytes(s))),
            _nonce,
            _chainId,
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
        const txn = TransactionBuilder.getRemoveSponsoredAddressesTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            vidaId,
            new Set(sponsoredAddresses.map((s) => hexToBytes(s))),
            _nonce,
            _chainId,    
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
        const txn = TransactionBuilder.getRemoveVidaAllowedSendersTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            vidaId,
            new Set(allowedSenders.map((s) => hexToBytes(s))),
            _nonce,
            _chainId,
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
        const txn = TransactionBuilder.getSetVidaPrivateStateTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            vidaId,
            privateState,
            _nonce,
            _chainId,
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
        const txn = TransactionBuilder.getSetVidaToAbsolutePublicTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            vidaId,
            _nonce,
            _chainId,
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
        const txn = TransactionBuilder.getSetPWRTransferRightsTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            vidaId,
            ownerCanTransferPWR,
            _nonce,
            _chainId,
        );

        return this.signAndSend(txn);
    }

    // prettier-ignore
    async transferPWRFromVida(vidaId: bigint, receiver: string, amount: bigint): Promise<TransactionResponse>;
    // prettier-ignore
    async transferPWRFromVida(vidaId: bigint, receiver: string, amount: bigint, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async transferPWRFromVida(vidaId: bigint, receiver: string, amount: bigint, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getTransferPWRFromVidaTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            vidaId,
            hexToBytes(receiver),
            amount,
            _nonce,
            _chainId,
        );

        return this.signAndSend(txn);
    }

    // #endregion

    // #region conduits txns
    // prettier-ignore
    async setConduitMode (vidaId: bigint, mode: number, conduitThreshold: number, conduits: string[], conduitsWithVotingPower: Map<string, bigint>): Promise<TransactionResponse>;
    // prettier-ignore
    async setConduitMode (vidaId: bigint, mode: number, conduitThreshold: number, conduits: string[], conduitsWithVotingPower: Map<string, bigint>, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async setConduitMode (vidaId: bigint, mode: number, conduitThreshold: number, conduits: string[], conduitsWithVotingPower: Map<string, bigint>, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        // const txn = TransactionBuilder.getConduitModeTransaction(
        //     BigInt(_feePerByte),
        //     this._addressBytes,
        //     vidaId,
        //     mode,
        //     conduitThreshold,
        //     new Set(conduits.map((s) => hexToBytes(s))),
        //     conduitsWithVotingPower,
        //     nonce,
        //     _chainId,
        // );

        // return this.signAndSend(txn);

        return {
            message: '',
            success: true,
            transactionHash: '',
        }// TODO: remove this line and uncomment the above code
    }

    // prettier-ignore
    async setConduitModeWithVidaBased(vidaId: bigint, mode: number, conduitThreshold: number, conduits: Array<string>, stakingPowers: Array<bigint>): Promise<TransactionResponse>;
    // prettier-ignore
    async setConduitModeWithVidaBased(vidaId: bigint, mode: number, conduitThreshold: number, conduits: Array<string>, stakingPowers: Array<bigint>, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async setConduitModeWithVidaBased(vidaId: bigint, mode: number, conduitThreshold: number, conduits: Array<string>, stakingPowers: Array<bigint>, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());
        const _nonce = nonce ?? (await this.getNonce());
    
        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getSetConduitModeWithVidaBasedTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            vidaId,
            mode,
            conduitThreshold,
            conduits.map((s) => hexToBytes(s)),
            stakingPowers,
            _nonce,
            _chainId,
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
        const _nonce = nonce ?? (await this.getNonce());


        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getConduitApprovalTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            vidaId,
            wrappedTxns.map((s) => hexToBytes(s)),
            _nonce,
            _chainId,
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
        const txn = TransactionBuilder.getRemoveConduitsTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            vidaId,
            conduits.map((s) => hexToBytes(s)),
            _nonce,
            _chainId,
        );

        return this.signAndSend(txn);
    }

    // #endregion

    // #region guardian transactions

    // prettier-ignore
    async approveAsGuardian(wrappedTxns: string[]): Promise<TransactionResponse>;
    // prettier-ignore
    async approveAsGuardian(wrappedTxns: string[], nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async approveAsGuardian(wrappedTxns: string[], nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());
        const _nonce = nonce ?? (await this.getNonce());


        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getGuardianApprovalTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            wrappedTxns.map((s) => hexToBytes(s)),
            _nonce,
            _chainId,
        );

        return this.signAndSend(txn);
    }

    // prettier-ignore
    async removeGuardian(): Promise<TransactionResponse>;
    // prettier-ignore
    async removeGuardian(nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async removeGuardian(nonce?: number, feePerByte?: string): Promise<TransactionResponse>{
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());
        const _nonce = nonce ?? (await this.getNonce());


        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getRemoveGuardianTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            _nonce,
            _chainId,
        );

        return this.signAndSend(txn);
    }

    // prettier-ignore
    async setGuardian(expiryDate: EpochTimeStamp, guardianAddress: string): Promise<TransactionResponse>;
    // prettier-ignore
    async setGuardian(expiryDate: EpochTimeStamp, guardianAddress: string, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async setGuardian(expiryDate: EpochTimeStamp, guardianAddress: string, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());
        const _nonce = nonce ?? (await this.getNonce());
        

        const _chainId = await this.getChainId();


        const txn = TransactionBuilder.getSetGuardianTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            expiryDate,
            hexToBytes(guardianAddress),
            _nonce,
            _chainId,
        );

        return this.signAndSend(txn);
    }

    // #endregion

    // #region proposal transactions

    // prettier-ignore
    async proposeChangeEarlyWithdrawPenalty(title: string, description: string, earlyWithdrawalTime: bigint, withdrawalPenalty: number): Promise<TransactionResponse>;
    // prettier-ignore
    async proposeChangeEarlyWithdrawPenalty(title: string, description: string, earlyWithdrawalTime: bigint, withdrawalPenalty: number, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async proposeChangeEarlyWithdrawPenalty(title: string, description: string, earlyWithdrawalTime: bigint, withdrawalPenalty: number, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getChangeEarlyWithdrawPenaltyProposalTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            title,
            description,
            earlyWithdrawalTime,
            withdrawalPenalty,
            _nonce,
            _chainId,
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
        const txn = TransactionBuilder.getChangeFeePerByteProposalTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            title,
            description,
            newFeePerByte,
            _nonce,
            _chainId,
        );

        return this.signAndSend(txn);
    }

    // prettier-ignore
    async proposeChangeMaxBlockSize(title: string, description: string, maxBlockSize: bigint): Promise<TransactionResponse>;
    // prettier-ignore
    async proposeChangeMaxBlockSize(title: string, description: string, maxBlockSize: bigint, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async proposeChangeMaxBlockSize(title: string, description: string, maxBlockSize: bigint, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getChangeMaxBlockSizeProposalTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            title,
            description,
            maxBlockSize,
            _nonce,
            _chainId,
        )

        return this.signAndSend(txn);
    }

    // prettier-ignore
    async proposeChangeMaxTxnSize(title: string, description: string, maxTxnSize: bigint): Promise<TransactionResponse>;
    // prettier-ignore
    async proposeChangeMaxTxnSize(title: string, description: string, maxTxnSize: bigint, nonce: number, feePerByte: string): Promise<TransactionResponse>;
    // prettier-ignore
    async proposeChangeMaxTxnSize(title: string, description: string, maxTxnSize: bigint, nonce?: number, feePerByte?: string): Promise<TransactionResponse> {
        const response = await this.makeSurePublicKeyIsSet();
        if (response != null && !response.success) { return response }

        const _nonce = nonce ?? (await this.getNonce());
        const _feePerByte = feePerByte ?? (await this.pwrjs.getFeePerByte());

        const _chainId = await this.getChainId();
        const txn = TransactionBuilder.getChangeMaxTxnSizeProposalTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            title,
            description,
            maxTxnSize,
            _nonce,
            _chainId,
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
        const txn = TransactionBuilder.getChangeOverallBurnPercentageProposalTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            title,
            description,
            burnPercentage,
            _nonce,
            _chainId,

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

        const txn = TransactionBuilder.getChangeRewardPerYearProposalTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            title,
            description,
            rewardPerYear,
            _nonce,
            _chainId,
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
        const txn = TransactionBuilder.getChangeValidatorCountLimitProposalTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            title,
            description,
            validatorCountLimit,
            _nonce,
            _chainId,
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
        const txn = TransactionBuilder.getChangeValidatorJoiningFeeProposalTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            title,
            description,
            joiningFee,
            _nonce,
            _chainId,
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
        const txn = TransactionBuilder.getChangeVidaIdClaimingFeeProposalTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            title,
            description,
            claimingFee,
            _nonce,
            _chainId,
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
        const txn = TransactionBuilder.getChangeVmOwnerTxnFeeShareProposalTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            title,
            description,
            vmOwnerTxnFeeShare,
            _nonce,
            _chainId,
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
        const txn = TransactionBuilder.getOtherProposalTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            title,
            description,
            _nonce,
            _chainId,
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
        const txn = TransactionBuilder.getVoteOnProposalTransaction(
            BigInt(_feePerByte),
            this._addressBytes,
            hexToBytes(proposalHash),
            vote,
            _nonce,
            _chainId,
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

    static async loadWalletNode(pwr: PWRJS, filePath: string): Promise<AbstractWallet> {
        try {
            if (typeof window !== 'undefined')
                throw new Error(
                    'This method is meant for node environment, please use loadWalletBrowser instead'
                );

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

            if (offset + 4 > data.length) throw new Error('File too small for secret key length');

            const secLength = data.readUInt32BE(offset);
            offset += 4;
            if (secLength === 0 || secLength > 4096)
                throw new Error(`Invalid secret key length: ${secLength}`);
            if (offset + secLength > data.length)
                throw new Error(`File too small for secret key of length ${secLength}`);

            const privateKeyBytes = data.slice(offset, offset + secLength);

            return AbstractWallet.fromKeys(privateKeyBytes, publicKeyBytes, pwr);

            // return new AbstractWallet(privateKeyBytes, publicKeyBytes, pwr);
            // } else {
            //     throw new Error('This method cannot be called on the client-side (browser)');
            // }
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

            // return new AbstractWallet(sk, pk, pwr);
            return AbstractWallet.fromKeys(sk, pk, pwr);
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
