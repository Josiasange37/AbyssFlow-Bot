const { log } = require('../utils/logger');

module.exports = {
    name: 'sweep',
    description: '🔍 Ghost Protocol Auditor: Scans for hidden bots and fraudulent accounts.',
    category: 'admin',
    isAdmin: true,
    isGroupOnly: true,
    async execute({ sock, chatId, message, isOwner, bot }) {
        try {
            await sock.sendMessage(chatId, { text: '🕵️ *Ghost Protocol Audit initialisé...* \nAnalyse des métadonnées du groupe en cours.' });

            const groupMetadata = await sock.groupMetadata(chatId);
            const participants = groupMetadata.participants;

            let suspiciousAccounts = [];
            let botAccounts = [];
            let businessAccounts = [];

            for (const participant of participants) {
                const jid = participant.id;
                const isLid = jid.includes('@lid');

                // Risk Factors
                let riskScore = 0;
                let reasons = [];

                if (isLid) {
                    riskScore += 40;
                    reasons.push('Compte LID (Identité cachée/Bot)');
                }

                // Check for "Bot" or suspicious patterns in name/ID
                const nameMatch = jid.split('@')[0];
                if (/bot|checker|test|proxy|v2|v3|attack/i.test(nameMatch)) {
                    riskScore += 30;
                    reasons.push('Identifiant suspect (Bot pattern)');
                }

                if (riskScore >= 40) {
                    suspiciousAccounts.push({
                        jid,
                        riskScore,
                        reasons: reasons.join(', ')
                    });
                }
            }

            // Summary Message
            let report = `📊 *RAPPORT D'AUDIT SÉCURITÉ* 📊\n\n`;
            report += `👥 *Total Membres:* ${participants.length}\n`;
            report += `⚠️ *Comptes Suspects détectés:* ${suspiciousAccounts.length}\n\n`;

            if (suspiciousAccounts.length > 0) {
                report += `🔍 *DÉTAILS DES MENACES POTENTIELLES :*\n`;
                suspiciousAccounts.forEach((acc, i) => {
                    report += `\n${i + 1}. @${acc.jid.split('@')[0]}\n`;
                    report += `   🚩 *Niveau de Risque:* ${acc.riskScore}%\n`;
                    report += `   🛡️ *Raison:* ${acc.reasons}\n`;
                });

                report += `\n💡 *Action recommandée:* Utilisez \`${bot.prefix || '*'}kick\` pour éliminer les menaces confirmées.`;
            } else {
                report += `✅ *Aucun bot fantôme détecté.* Le périmètre semble sécurisé.`;
            }

            await sock.sendMessage(chatId, {
                text: report,
                mentions: suspiciousAccounts.map(a => a.jid)
            });

        } catch (error) {
            log.error('Error in SWEEP command:', error);
            await sock.sendMessage(chatId, { text: '❌ Erreur lors de l\'audit ghost protocol.' });
        }
    }
};
