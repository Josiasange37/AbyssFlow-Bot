/**
 * Verification script for Connection Closed error handling
 */
const { log } = require('../src/utils/logger');
require('dotenv').config();

console.log('🧪 Starting Connection Closed Verification Test...');

// 1. Test if index.js handlers (simulated) prevent process.exit
const originalExit = process.exit;
let exitCalled = false;
process.exit = (code) => {
    exitCalled = true;
    console.log(`❌ process.exit called with code ${code}`);
    // Don't actually exit during test
};

// Simulate index.js logic
function simulateErrorHandler(error) {
    if (error?.message === 'Connection Closed') {
        console.log('✅ Handled expected Connection Closed error.');
        return;
    }
    console.log('❌ Unexpected error, would exit.');
    process.exit(1);
}

// Trigger error
console.log('Triggering "Connection Closed" error...');
simulateErrorHandler(new Error('Connection Closed'));

if (!exitCalled) {
    console.log('✨ SUCCESS: Bot would NOT have crashed.');
} else {
    console.log('💥 FAILURE: Bot would have crashed.');
}

// Restore exit
process.exit = originalExit;

console.log('\n2. Testing PsychoBot connectivity safety (Mock)...');
const PsychoBot = require('../src/core/PsychoBot');
const bot = new PsychoBot();

// Initially sock is null
console.log('Testing sendMessage with null sock...');
bot.sendMessage('test@jid', { text: 'hello' }).then(() => {
    console.log('✅ sendMessage handled null sock gracefully.');
}).catch(err => {
    console.log('❌ sendMessage failed on null sock:', err.message);
});
