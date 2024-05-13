import TransactionDecoder from '../src/protocol/transaction-decoder';
import TransactionBuilder from '../src/protocol/transaction-builder';
import { Transaction_ID } from '../src/static/enums/transaction.enum';
import { bytesToHex, signTxn } from '../src/utils';

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

    const pvk =
        '0x65d39c88806fd85c9a860e1f26155af4321c5aaaf98d5d164bdab13b5e924ffd';
    const senderHex = '0xf8ef0db764721627e00e840c713c88e278a596d2';
    const senderBytes = hexToUint8Array(senderHex);

    const txnDet = {
        id: Transaction_ID.TRANSFER,
        chainId: 0,
        nonce: 4,
        amount: '1',
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

    const delegateTxn = {
        id: Transaction_ID.DELEGATE,
        chainId: 0,
        nonce: 4,
        validator: '0x61bd8fc1e30526aaf1c4706ada595d6d236d9883',
        amount: '1',
    };

    const withdrawTxn = {
        id: Transaction_ID.WITHDRAW,
        chainId: 0,
        nonce: 4,
        sharesAmount: '1',
        from: '0x0000000000000000000000000000000000000000',
    };

    const claimVmIdTxn = {
        id: Transaction_ID.CLAIM_VM_ID,
        chainId: 0,
        nonce: 0,
        vmId: '100',
    };

    const vmDataTxn = {
        id: Transaction_ID.VM_DATA_TXN,
        chainId: 0,
        data: 'hola mundo',
        vmId: '100',
        nonce: 4,
    };

    const setGuardianTxn = {
        id: Transaction_ID.SET_GUARDIAN,
        chainId: 0,
        nonce: 0,
        guardian: '0x8cc1d696a9a69d6345ad2de0a9d9fadecc6ba767',
        expiryDate: 1746772236 * 1000, //seconds
    };

    const removeGuardianTxn = {
        id: Transaction_ID.REMOVE_GUARDIAN,
        chainId: 0,
        nonce: 0,
        guardian: '0x8cc1d696a9a69d6345ad2de0a9d9fadecc6ba767',
    };

    it('decode', () => {
        const { chainId, id, nonce, recipient, amount } = txnDet;

        const txn = TransactionBuilder.getTransferPwrTransaction(
            chainId,
            nonce,
            amount,
            recipient
        );

        const signature = signTxn(txn, pvk);

        const txnBytes = new Uint8Array([...txn, ...signature]);

        const result = decoder.decode(txnBytes);

        expect(result).toEqual({
            sender: senderHex,
            receiver: recipient,
            value: amount,
            nonce,
            size: txnBytes.length,
            rawTransaction: txnBytes,
            chainId,
        });
    });

    it('decode transfer txn', () => {
        const { id, chainId, nonce, amount, recipient } = txnDet;
        const txn = TransactionBuilder.getTransferPwrTransaction(
            chainId,
            nonce,
            amount,
            recipient
        );

        const signature = signTxn(txn, pvk);
        const txnBytes = new Uint8Array([...txn, ...signature]);

        const result = decoder.decodeTransfer(txnBytes, senderBytes, nonce);

        expect(result).toEqual({
            sender: senderHex,
            receiver: recipient,
            value: amount,
            nonce,
            size: txnBytes.length,
            rawTransaction: txnBytes,
            chainId,
        });
    });

    it('decode join transaction', () => {
        const { id, chainId, nonce, ip } = joinTxnDet;

        // Example transaction data
        const txnRaw = new Uint8Array([
            1, 0, 0, 0, 0, 0, 49, 50, 55, 46, 49, 46, 49, 46, 49, 147, 117, 20,
            52, 174, 185, 143, 73, 81, 6, 172, 69, 59, 101, 47, 193, 69, 77, 38,
            249, 61, 31, 143, 72, 160, 100, 76, 124, 147, 126, 28, 155, 12, 129,
            245, 231, 80, 210, 86, 61, 36, 30, 112, 106, 249, 62, 22, 186, 33,
            124, 181, 48, 90, 227, 165, 42, 250, 19, 105, 242, 96, 65, 235, 50,
            28,
        ]);

        // Decode the transaction
        const result = decoder.decodeJoin(txnRaw, senderBytes, nonce);

        // Check the results
        // expect(result.sender).toEqual('0xdeadbeef');
        expect(result.nonce).toEqual(0);
        expect(result.size).toEqual(txnRaw.length);
        expect(result.ip).toEqual(ip);
        expect(result.rawTransaction).toEqual(txnRaw);
        expect(result.chainId).toEqual(chainId);
    });

    it('decode claim spot', () => {
        const { id, chainId, nonce } = claimSpot;

        // Example transaction data
        const txnRaw = new Uint8Array([
            2, 0, 0, 0, 0, 0, 71, 118, 6, 45, 74, 132, 27, 94, 84, 165, 144,
            147, 246, 41, 241, 115, 164, 188, 235, 0, 132, 187, 18, 219, 76,
            122, 187, 13, 131, 168, 160, 250, 105, 140, 40, 177, 27, 136, 166,
            197, 27, 112, 3, 65, 155, 78, 206, 161, 90, 38, 76, 137, 56, 12,
            136, 232, 65, 109, 108, 18, 67, 70, 131, 94, 28,
        ]);

        // Decode the transaction
        const result = decoder.decodeClaimSpot(txnRaw, senderBytes, nonce);

        // Check the results
        // expect(result.sender).toEqual('0xdeadbeef');

        expect(result).toEqual({
            nonce,
            size: txnRaw.length,
            chainId,
            rawTransaction: txnRaw,
            sender: senderHex,
        });
    });

    it('decode delegate txn', () => {
        const { id, chainId, nonce, amount, validator } = delegateTxn;

        const txn = new Uint8Array([
            3, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 1, 97, 189, 143, 193, 227, 5,
            38, 170, 241, 196, 112, 106, 218, 89, 93, 109, 35, 109, 152, 131,
            145, 246, 60, 72, 145, 128, 91, 48, 50, 237, 24, 76, 70, 7, 38, 162,
            107, 17, 234, 229, 11, 49, 129, 185, 90, 2, 30, 255, 236, 2, 138,
            221, 15, 77, 37, 215, 255, 132, 169, 3, 183, 184, 216, 18, 101, 9,
            155, 211, 180, 18, 226, 107, 112, 127, 197, 100, 62, 7, 67, 232, 84,
            202, 67, 35, 28,
        ]);

        const result = decoder.decodeDelegate(txn, senderBytes, nonce);

        expect(result).toEqual({
            sender: senderHex,
            validator,
            amount,
            nonce,
            size: txn.length,
            chainId,
            rawTransaction: txn,
        });
    });

    it('decode withdraw', () => {
        const { id, chainId, nonce, sharesAmount, from } = withdrawTxn;

        const txn = new Uint8Array([
            4, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 141, 81, 187, 117, 24, 45, 157, 19,
            199, 192, 118, 80, 229, 159, 10, 54, 143, 230, 64, 123, 144, 164,
            75, 53, 111, 133, 154, 194, 55, 16, 15, 144, 70, 186, 103, 23, 72,
            42, 248, 200, 102, 83, 248, 109, 60, 164, 46, 30, 73, 131, 48, 31,
            131, 113, 219, 14, 34, 93, 236, 194, 246, 120, 121, 199, 28,
        ]);

        const result = decoder.decodeWithdraw(txn, senderBytes, nonce);

        expect(result).toEqual({
            sender: senderHex,
            validator: from,
            sharesAmount,
            nonce,
            size: txn.length,
            rawTransaction: txn,
            chainId,
        });
    });

    it('decode vm data txn', () => {
        // encode and decode
        // const data = 'Hello World!';
        // const dataBytes = new TextEncoder().encode(data);
        // const hex = bytesToHex(dataBytes);

        // const bytesAgain = new Uint8Array(hexToUint8Array(hex));
        // const dataAgain = new TextDecoder().decode(bytesAgain);

        // console.log({
        //     data,
        //     dataBytes,
        //     hex,
        //     bytesAgain,
        //     dataAgain,
        // });

        console.log({
            data: vmDataTxn.data,
        });

        const { id, chainId, vmId, data, nonce } = vmDataTxn;

        const txn = TransactionBuilder.getVmDataTransaction(
            vmId,
            data,
            nonce,
            chainId
        );

        const signature = signTxn(txn, pvk);
        const txnBytes = new Uint8Array([...txn, ...signature]);

        const result = decoder.decodeVmDataTxn(txnBytes, senderBytes, nonce);

        expect(result).toEqual({
            sender: senderHex,
            nonce,
            size: txnBytes.length,
            vmId,
            // data to hex
            data: `0x${bytesToHex(new TextEncoder().encode(data))}`,
            rawTransaction: txnBytes,
            chainId,
        });
    });

    it('decode claim vmId', () => {
        const { chainId, id, nonce, vmId } = claimVmIdTxn;

        const txn = TransactionBuilder.getClaimVmIdTransaction(
            vmId,
            nonce,
            chainId
        );

        const signature = signTxn(txn, pvk);

        const txnBytes = new Uint8Array([...txn, ...signature]);

        const result = decoder.decodeClaimVmId(txnBytes, senderBytes, nonce);

        expect(result).toEqual({
            sender: senderHex,
            nonce,
            size: txnBytes.length,
            vmId,
            rawTransaction: txnBytes,
            chainId,
        });
    });

    it('decode set guardian txn', () => {
        const { id, chainId, nonce, guardian, expiryDate } = setGuardianTxn;

        const txn = TransactionBuilder.getSetGuardianTransaction(
            guardian,
            expiryDate,
            nonce,
            chainId
        );

        const signature = signTxn(txn, pvk);

        const txnBytes = new Uint8Array([...txn, ...signature]);

        const result = decoder.decodeSetGuardian(txnBytes, senderBytes, nonce);

        expect(result).toEqual({
            sender: senderHex,
            guardian,
            expiryDate,
            nonce,
            size: txnBytes.length,
            rawTransaction: txnBytes,
            chainId,
        });
    });

    it('decode remove guardian txn', () => {
        const { id, chainId, nonce, guardian } = removeGuardianTxn;

        const txn = TransactionBuilder.getRemoveGuardianTransaction(
            nonce,
            chainId
        );

        const signature = signTxn(txn, pvk);

        const txnBytes = new Uint8Array([...txn, ...signature]);

        const result = decoder.decodeRemoveGuardianTxn(
            txnBytes,
            senderBytes,
            nonce
        );

        expect(result).toEqual({
            sender: senderHex,
            nonce,
            size: txnBytes.length,
            rawTransaction: txnBytes,
            chainId,
        });
    });
});
