import { expect, test, describe } from 'vitest';

import BytesService from '../src/services/bytes.service';
import FalconServiceNode from '../src/services/falcon/falcon-node.service';

const path = require('path') as typeof import('path');
const fs = require('fs') as typeof import('fs');

/**
 * This file is for temporary tests for services, we don't add this tests
 * since those files are straightforward and don't need to be tested.
 *
 */

describe('', () => {
    test('test service itself', async () => {
        const keypair = await FalconServiceNode.generateKeyPair();

        const bytes = BytesService.keypairToArrayBuffer(keypair);

        const keypairrestored = BytesService.arrayBufferToKeypair(bytes);

        const ogpk = keypair.pk;
        const ogsk = keypair.sk;

        const { pk, sk } = keypairrestored;

        console.log({
            ogpk,
            pk,
        });

        expect(pk).toStrictEqual(ogpk);
        expect(sk).toStrictEqual(ogsk);
    });
});
