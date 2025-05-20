'use strict';

const browserTesting = require('..');
const assert = require('assert').strict;

assert.strictEqual(browserTesting(), 'Hello from browserTesting');
console.info('browserTesting tests passed');
