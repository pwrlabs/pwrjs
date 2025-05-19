'use strict';

const coreBrowser = require('..');
const assert = require('assert').strict;

assert.strictEqual(coreBrowser(), 'Hello from coreBrowser');
console.info('coreBrowser tests passed');
