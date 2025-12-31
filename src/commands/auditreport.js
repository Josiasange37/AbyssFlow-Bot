const { log } = require('../utils/logger');

module.exports = {
    name: 'auditreport',
    aliases: ['audit', 'status-report'],
    description: '📊 Sovereign Mission Summary: Generates a technical audit of protocol enforcements.',
    category: 'admin',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, bot }) {
        try {
            const stats = bot.protocolEngine.getAuditStats();
            const uptime = Math.floor(stats.uptime / (1000 * 60 * 60)); // Uptime in hours

            const reportText = [
                `🔳 *ABYSSFLOW_AUDITOR_REPORT_v3.1*`,
                `________________________________`,
                `📈 *MISSION_METRICS:*`,
                `> Neutralizations: ${stats.neutralizations}`,
                `> Uptime: ${uptime}h ${Math.floor((stats.uptime / 60000) % 60)}m`,
                `> Command_Count: ${bot.commandCount}`,
                '',
                `📡 *ACTIVE_PROTOCOLS:*`,
                `> Shadow_Ban: ${stats.activeProtocols.shadowBan}`,
                `> Blackout: ${stats.activeProtocols.blackout}`,
                `> Mute: ${stats.activeProtocols.mute}`,
                `> Vex: ${stats.activeProtocols.vex}`,
                '',
                `⚠️ *STATUS:* Protocol supremacy established.`,
                `ID: AUDIT_STZ_${Date.now().toString(36).toUpperCase()}`
            ].join('\n');

            await sock.sendMessage(chatId, { text: reportText });
        } catch (error) {
            log.error('Error in AUDITREPORT:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec de la génération du rapport d\'audit.' });
        }
    }
};
