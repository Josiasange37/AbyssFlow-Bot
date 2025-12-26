const axios = require('axios');
const { log } = require('./logger');

/**
 * Keeps the bot alive on platforms like Render by self-pinging.
 * @param {string} url The external URL of the bot.
 * @param {number} interval Minutes between pings (default 10).
 */
function keepAlive(url, interval = 10) {
    if (!url) {
        log.warn('⚠️ APP_URL missing. Anti-Sleep disabled.');
        return;
    }

    log.info(`🚀 Anti-Sleep activated for: ${url} (Every ${interval} min)`);

    setInterval(async () => {
        try {
            const statusUrl = url.endsWith('/') ? url : `${url}/`;
            await axios.get(statusUrl);
            log.debug('💤 Anti-Sleep: Self-ping successful.');
        } catch (error) {
            log.error(`❌ Anti-Sleep Ping Error: ${error.message}`);
        }
    }, interval * 60 * 1000);
}

module.exports = { keepAlive };
