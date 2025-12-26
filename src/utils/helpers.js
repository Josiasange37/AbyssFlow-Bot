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
    // Average typing speed: 40 words per minute = ~200 characters per minute
    // = ~3.3 characters per second
    const baseTime = 1000; // Minimum 1 second
    const typingTime = (messageLength / 3.3) * 1000;
    const randomVariation = Math.random() * 1000; // Add 0-1s random variation
    return Math.min(baseTime + typingTime + randomVariation, 8000); // Max 8 seconds
}

module.exports = {
    sleep,
    normalizeNumber,
    simulateTyping,
    withTimeout,
    calculateTypingDuration
};
