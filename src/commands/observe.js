const { log } = require('../utils/logger');

module.exports = {
    name: 'observe',
    description: '👁️ Forensic Link Tracer: Maps all external interactions and detects fraudulent links.',
    category: 'admin',
    isAdmin: true,
    isGroupOnly: true,
    async execute({ sock, chatId, message, bot }) {
        try {
            await sock.sendMessage(chatId, { text: '👁️ *Observation Forensique activée...* \nRécupération de l\'historique des liens partagés.' });

            // Extract links from message cache
            const cache = bot.messageCache;
            const linkEntries = [];
            const urlPattern = /https?:\/\/[^\s]+/g;

            cache.forEach((msg) => {
                if (msg.chatId === chatId && msg.text) {
                    const matches = msg.text.match(urlPattern);
                    if (matches) {
                        matches.forEach(url => {
                            linkEntries.push({
                                url,
                                sender: msg.sender,
                                timestamp: msg.timestamp
                            });
                        });
                    }
                }
            });

            if (linkEntries.length === 0) {
                return await sock.sendMessage(chatId, { text: '✅ *Aucun lien suspect trouvé dans le cache récent.*' });
            }

            // Analyze links
            let analysisReport = `📊 *RAPPORT FORENSIQUE DES LIENS* 📊\n\n`;

            // Deduplicate and group by sender
            const uniqueLinks = [...new Set(linkEntries.map(e => e.url))].slice(-10); // Last 10 unique links

            for (const url of uniqueLinks) {
                const entries = linkEntries.filter(e => e.url === url);
                const mainSender = entries[0].sender;

                // Simple heuristic analysis
                let threatLevel = '🟢 BAS';
                let alert = '';

                if (/bit\.ly|t\.co|tinyurl|wa\.me\/settings/i.test(url)) {
                    threatLevel = '🔴 ÉLEVÉ';
                    alert = ' (Raccourcisseur suspect / Exploit)';
                } else if (/gift|free|win|login|verify/i.test(url)) {
                    threatLevel = '🟡 MOYEN';
                    alert = ' (Potential Phishing)';
                }

                analysisReport += `🔗 *Lien:* ${url}\n`;
                analysisReport += `👤 *Diffusé par:* @${mainSender.split('@')[0]}\n`;
                analysisReport += `🛡️ *Niveau de Menace:* ${threatLevel}${alert}\n\n`;
            }

            const mentions = [...new Set(linkEntries.map(e => e.sender))];

            await sock.sendMessage(chatId, {
                text: analysisReport,
                mentions
            });

        } catch (error) {
            log.error('Error in OBSERVE command:', error);
            await sock.sendMessage(chatId, { text: '❌ Erreur lors du traçage forensique.' });
        }
    }
};
