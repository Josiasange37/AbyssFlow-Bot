const { log } = require('../utils/logger');
const axios = require('axios');

module.exports = {
    name: 'clocksync',
    aliases: ['sync-time', 'calibrate'],
    description: '⏱️ CLOCK-SYNC Protocol: Calibrates internal timing for precise stanza delivery.',
    category: 'admin',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, bot }) {
        try {
            await sock.sendMessage(chatId, { text: '⏱️ *INITIATING_CLOCK_CALIBRATION*...\n📡 *SIGNAL:* Fetching NTP reference...' });

            const start = Date.now();
            const response = await axios.get('http://worldtimeapi.org/api/timezone/Etc/UTC', { timeout: 5000 });
            const end = Date.now();
            const latency = end - start;

            const networkTime = new Date(response.data.datetime).getTime();
            const localTime = end;
            const offset = networkTime - (localTime - (latency / 2));

            bot.timeOffset = offset; // Store for precise executions

            const report = [
                `✅ *CALIBRATION_SUCCESSFUL*`,
                `________________________________`,
                `⏱️ *NETWORK_LATENCY:* ${latency}ms`,
                `⚖️ *TIME_OFFSET:* ${offset > 0 ? '+' : ''}${Math.round(offset)}ms`,
                `📦 *PROTOCOL:* AbyssFlow Temporal_Sync_v1`,
                '',
                `⚠️ *NOTICE:* Stanza headers now synchronized with UTC reference.`
            ].join('\n');

            await sock.sendMessage(chatId, { text: report });
        } catch (error) {
            log.error('Error in CLOCKSYNC:', error.message);
            await sock.sendMessage(chatId, { text: '❌ *CALIBRATION_FAILED:* Network timeout or unreachable reference.' });
        }
    }
};
