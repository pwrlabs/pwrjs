import TransactionDecoder from '../src/protocol/transaction-decoder';
import TransactionBuilder from '../src/protocol/transaction-builder';
import { Transaction_ID } from '../src/static/enums/transaction.enum';
import { bytesToHex } from '../src/utils';
import {
    generateDataTxnBytes,
    generateJoinTxnBytes,
    generateTxnBytes,
} from '../src/wallet/wallet';

function hexToUint8Array(hexString: string): Uint8Array {
    // Remove the '0x' prefix if present
    hexString = hexString.replace(/^0x/, '');
    // Convert hex string to a byte array
    const byteArray = new Uint8Array(hexString.length / 2);
    for (let i = 0, j = 0; i < hexString.length; j++, i += 2) {
        byteArray[j] = parseInt(hexString.substring(i, i + 2), 16);
    }
    return byteArray;
}

describe('decoder', () => {
    const decoder = new TransactionDecoder();

    const senderHex = '0xe47d5f4c1731c3c0ea0a75872593cbf61f2cbf90';
    const senderBytes = hexToUint8Array(senderHex);

    const txnDet = {
        id: Transaction_ID.TRANSFER,
        chainId: 0,
        nonce: 0,
        value: '1',
        recipient: '0x0000000000000000000000000000000000000000',
    };

    const joinTxnDet = {
        id: Transaction_ID.JOIN,
        chainId: 0,
        nonce: 0,
        ip: '127.1.1.1',
    };

    const claimSpot = {
        id: Transaction_ID.CLAIM_SPOT,
        chainId: 0,
        nonce: 0,
    };

    const vmDataTxn = {
        id: Transaction_ID.VM_DATA_TXN,
        chainId: 0,
        nonce: 0,
        dataBytes: new TextEncoder().encode(
            JSON.stringify({ name: 'Test VM Data' })
        ),
        dataHex: bytesToHex(
            new TextEncoder().encode(JSON.stringify({ name: 'Test VM Data' }))
        ),
        vmId: '100',
    };

    const delegateTxn = {
        id: Transaction_ID.DELEGATE,
        chainId: 0,
        nonce: 4,
        validator: '0x61bd8fc1e30526aaf1c4706ada595d6d236d9883',
        amount: '1',
    };

    const setGuardianTxn = {
        id: Transaction_ID.SET_GUARDIAN,
        chainId: 0,
        nonce: 0,
        guardian: '0x61bd8fc1e30526aaf1c4706ada595d6d236d9883',
        // 10 days from now epoch time
        expiryDate: Math.floor(Date.now()) + 864000,
    };

    it('test', () => {
        const { id, chainId, nonce, expiryDate, guardian } = setGuardianTxn;
        // const test = generateTxnBytes(id, chainId, nonce, value, recipient);

        console.log('test', setGuardianTxn);

        const bytes = TransactionBuilder.getSetGuardianTransaction(
            guardian,
            expiryDate,
            nonce,
            chainId
        );

        console.log(bytes);
    });

    it('decode txn', () => {
        const { id, chainId, nonce, value, recipient } = txnDet;
        const txn = new Uint8Array([
            1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 59, 154, 202, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ]);

        const result = decoder.decodeTransfer(txn, senderBytes, nonce);

        expect(result.sender).toEqual(senderHex);
        expect(result.receiver).toEqual(recipient);
        expect(result.value).toBe(value);
        expect(result.nonce).toBe(nonce);
        expect(result.size).toBe(txn.length);
        expect(result.chainId).toBe(chainId);
    });

    // it('decode vm data txn', () => {
    //     const { id, chainId, nonce, vmId, dataBytes, dataHex } = vmDataTxn;

    //     const txnRaw = new Uint8Array([
    //         5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 100, 123, 34, 110, 97, 109,
    //         101, 34, 58, 34, 84, 101, 115, 116, 32, 86, 77, 32, 68, 97, 116, 97,
    //         34, 125,
    //     ]);

    //     const result = decoder.decodeVmDataTxn(txnRaw, senderBytes, nonce);

    //     expect(result.vmId).toEqual(vmId);
    //     // expect(result.data).toEqual(dataHex);
    //     expect(result.nonce).toEqual(nonce);
    //     expect(result.size).toEqual(txnRaw.length);
    //     expect(result.chainId).toEqual(chainId);
    // });

    it('decode delegate txn', () => {
        const { id, chainId, nonce, amount, validator } = delegateTxn;

        const txn = new Uint8Array([
            3, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 1, 97, 189, 143, 193, 227, 5,
            38, 170, 241, 196, 112, 106, 218, 89, 93, 109, 35, 109, 152, 131,
        ]);

        const result = decoder.decodeDelegate(txn, senderBytes, nonce);

        expect(result.sender).toEqual(senderHex);
        expect(result.validator).toEqual(validator);
        expect(result.amount).toEqual(amount);
        expect(result.nonce).toEqual(nonce);
        expect(result.size).toEqual(txn.length);
        expect(result.chainId).toEqual(chainId);
    });

    it('decode set guardian txn', () => {
        const { id, chainId, nonce, guardian, expiryDate } = setGuardianTxn;

        const txn = new Uint8Array([
            8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 87, 71, 210, 201, 97, 189, 143, 193,
            227, 5, 38, 170, 241, 196, 112, 106, 218, 89, 93, 109, 35, 109, 152,
            131,
        ]);

        const result = decoder.decodeSetGuardian(txn, senderBytes, nonce);

        expect(result.sender).toEqual(senderHex);
        expect(result.guardian).toEqual(guardian);
        expect(result.expiryDate).toEqual(expiryDate);
        expect(result.nonce).toEqual(nonce);
        expect(result.size).toEqual(txn.length);
        expect(result.chainId).toEqual(chainId);
    });

    // it('decode set guardian txn', () => {
    //     const { id, chainId, nonce, guardian, expiryDate } = setGuardianTxn;

    // it(' join transaction', () => {
    //     const { id, chainId, nonce, ip } = joinTxnDet;

    //     // Example transaction data
    //     const txnRaw = new Uint8Array([
    //         1, 0, 0, 0, 0, 0, 49, 50, 55, 46, 49, 46, 49, 46, 49,
    //     ]);

    //     console.log({
    //         length: txnRaw.length,
    //     });

    //     // Decode the transaction
    //     const result = decoder.decodeJoin(txnRaw, senderBytes, nonce);

    //     // Check the results
    //     // expect(result.sender).toEqual('0xdeadbeef');
    //     expect(result.nonce).toEqual(0);
    //     expect(result.size).toEqual(txnRaw.length);
    //     expect(result.ip).toEqual(ip);
    //     expect(result.rawTransaction).toEqual(txnRaw);
    //     expect(result.chainId).toEqual(chainId);
    // });

    // it('claim spot', () => {
    //     const { id, chainId, nonce } = claimSpot;

    //     // Example transaction data
    //     const txnRaw = new Uint8Array([
    //         2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    //     ]);

    //     // Decode the transaction
    //     const result = decoder.decodeClaimSpot(txnRaw, senderBytes, nonce);

    //     // Check the results
    //     // expect(result.sender).toEqual('0xdeadbeef');
    //     expect(result.nonce).toEqual(0);
    //     expect(result.size).toEqual(txnRaw.length);
    //     expect(result.rawTransaction).toEqual(txnRaw);
    //     expect(result.chainId).toEqual(chainId);
    // });
});
