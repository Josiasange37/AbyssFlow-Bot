const { log } = require('../utils/logger');

module.exports = {
    name: 'massprobe',
    aliases: ['probe', 'perimeter'],
    description: '🔍 MASS-PROBE: Scans all shared groups to identify a target\'s presence and surveillance perimeter.',
    category: 'intelligence',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : null);

            if (!target) return await sock.sendMessage(chatId, { text: '❌ Cible manquante pour le scan.' });

            await sock.sendMessage(chatId, { text: `🔍 *INITIATION DU MASS-PROBE* sur @${target.split('@')[0]}...`, mentions: [target] });

            const groups = await sock.groupFetchAllParticipating();
            const groupList = Object.values(groups);
            const identifiedIn = [];

            for (const group of groupList) {
                const isMember = group.participants.some(p => p.id.split(':')[0] === target.split(':')[0]);
                if (isMember) {
                    identifiedIn.push(group.subject);
                }
            }

            const report = [
                `🔍 *PROBE REPORT:* @${target.split('@')[0]}`,
                `________________________________`,
                `🛡️ *Network Perimeter:* AbyssFlow Shared Nodes`,
                `📈 *Groups Detected:* ${identifiedIn.length}`,
                identifiedIn.length > 0 ? `\n*ACTIVE NODES:*\n${identifiedIn.map(name => `- ${name}`).join('\n')}` : `\n_Aucune présence détectée dans les secteurs managés._`,
                `________________________________`,
                `🚩 *VERDICT:* ${identifiedIn.length > 3 ? 'HIGH-RISK TARGET' : 'LOW-LEVEL SUBJECT'}`
            ].join('\n');

            await sock.sendMessage(chatId, {
                text: report,
                mentions: [target],
                contextInfo: {
                    externalAdReply: {
                        title: "SURVEILLANCE_PERIMETER_REPORT",
                        body: "AbyssFlow Intelligence Suite",
                        mediaType: 1,
                        thumbnailUrl: "https://cdn-icons-png.flaticon.com/512/3649/3649460.png"
                    }
                }
            });

        } catch (error) {
            log.error('Error in MASSPROBE:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec du scan périmétrique.' });
        }
    }
};
