module.exports = {
    name: 'keepalive',
    description: 'Vérifie le statut du système de maintien en ligne (Keep-Alive)',
    category: 'core',
    async execute({ sock, chatId, message, bot, config }) {
        const isAlive = config.keepAlive;
        const renderUrl = config.renderUrl || 'Non défini';
        const lastPulse = global.lastKeepAlivePulse
            ? new Date(global.lastKeepAlivePulse).toLocaleTimeString()
            : 'Aucun signal';

        const lines = [];
        lines.push(`╔════════════════════════════╗`);
        lines.push(`║    📡 MONITORING SYSTEM    ║`);
        lines.push(`╠════════════════════════════╣`);
        lines.push(`║ STATUS: ${isAlive ? 'ACTIVE ✅' : 'DISABLED ❌'}`.padEnd(29) + `║`);
        lines.push(`║ URL: ${renderUrl.substring(0, 18)}...`.padEnd(29) + `║`);
        lines.push(`║ PULSE: ${lastPulse.padEnd(17)} ║`);
        lines.push(`╠════════════════════════════╣`);
        lines.push(`║ UPTIME: ${bot.formatDuration(Date.now() - bot.metrics.startedAt)}`.padEnd(29) + `║`);
        lines.push(`╚════════════════════════════╝`);

        await bot.sendMessage(chatId, { text: lines.join('\n') }, { quoted: message });
    }
};
