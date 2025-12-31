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

            await sock.sendMessage(chatId, { text: `🔍 *INITIATING MASS-PROBE* on @${target.split('@')[0]}...`, mentions: [target] });

            // 1. Perimeter Scan (Groups)
            const groups = await sock.groupFetchAllParticipating();
            const groupList = Object.values(groups);
            const identifiedIn = [];

            for (const group of groupList) {
                const isMember = group.participants.some(p => p.id.split(':')[0] === target.split(':')[0]);
                if (isMember) {
                    identifiedIn.push(group.subject);
                }
            }

            // 2. Deep Probe (Status/Bio OSINT)
            let bio = "UNAVAILABLE";
            let identifiedSocials = [];
            try {
                const statusData = await sock.fetchStatus(target);
                bio = statusData?.status || "NO_BIO";

                // GitHub Handle Detection
                const githubMatch = bio.match(/github\.com\/([a-zA-Z0-9-]+)/i) || bio.match(/octocat[:\s]+([a-zA-Z0-9-]+)/i);
                if (githubMatch) identifiedSocials.push(`GitHub: ${githubMatch[1]}`);

                // General Social Handles (@user)
                const socialMatches = bio.match(/@([a-zA-Z0-9._-]+)/g);
                if (socialMatches) identifiedSocials.push(...socialMatches.map(h => `Handle: ${h}`));
            } catch (e) {
                log.debug(`Failed to fetch status for ${target}`);
            }

            const report = [
                `🔍 *PROBE REPORT:* @${target.split('@')[0]}`,
                `________________________________`,
                `🛡️ *NETWORK_PERIMETER:* AbyssFlow Shared Nodes`,
                `📈 *GROUPS_DETECTED:* ${identifiedIn.length}`,
                identifiedIn.length > 0 ? `\n*ACTIVE_NODES:*\n${identifiedIn.map(name => `- ${name}`).join('\n')}` : `\n_Aucune présence détectée dans les secteurs managés._`,
                '',
                `🕵️ *OSINT_EXTRACT:* [DEEP_SCAN]`,
                `> BIO: "${bio}"`,
                `> FOOTPRINT: ${identifiedSocials.length > 0 ? identifiedSocials.join(' | ') : 'NONE_DETECTED'}`,
                `________________________________`,
                `🚩 *VERDICT:* ${identifiedIn.length > 3 || identifiedSocials.length > 0 ? 'SIGNIFICANT_ENTITY' : 'LOW-LEVEL_SUBJECT'}`
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
