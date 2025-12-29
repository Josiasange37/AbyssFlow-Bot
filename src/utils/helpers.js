function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeNumber(input) {
    if (!input) return '';
    // Take part before : (device) or @ (domain) to get the raw number
    const clean = input.split('@')[0].split(':')[0];
    return clean.replace(/[^0-9]/g, '');
}

// Simulate realistic typing to avoid WhatsApp ban
async function simulateTyping(sock, chatId, durationMs = 3000) {
    try {
        await sock.sendPresenceUpdate('composing', chatId);
        await sleep(durationMs);
        await sock.sendPresenceUpdate('paused', chatId);
    } catch (error) {
        // Ignore typing simulation errors
    }
}

// Timeout wrapper to prevent hanging operations
async function withTimeout(promise, timeoutMs = 30000, errorMessage = 'Opération timeout') {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
        )
    ]);
}

// Calculate realistic typing duration based on message length
function calculateTypingDuration(messageLength) {
    // Optimized for speed: ~50 characters per second (Super fast)
    const baseTime = 100; // Minimum 0.1 second
    const typingTime = (messageLength / 50) * 1000;
    const randomVariation = Math.random() * 200;
    return Math.min(baseTime + typingTime + randomVariation, 1500); // Max 1.5 seconds
}

module.exports = {
    sleep,
    normalizeNumber,
    simulateTyping,
    withTimeout,
    calculateTypingDuration
};
