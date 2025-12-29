/**
 * CLI Runner for Genkit Flows
 * Usage: node run_flow.js "Your message here"
 */
const { psychoChatFlow } = require('./src/core/GenkitBrain');

async function main() {
    const input = process.argv[2];

    if (!input) {
        console.error('❌ Please provide a message: node run_flow.js "Hello"');
        process.exit(1);
    }

    console.log(`🤖 Psycho Bot is thinking...`);
    console.log(`📝 Input: "${input}"\n`);

    try {
        const response = await psychoChatFlow(input);
        console.log(`⚡ Psycho Bot:\n${response}`);
    } catch (error) {
        console.error('❌ Error running flow:', error.message);
    }
}

main();
