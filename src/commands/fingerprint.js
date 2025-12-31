const { log } = require('../utils/logger');

module.exports = {
    name: 'fingerprint',
    description: '📊 OS & Client Detector: Identifies the target\'s platform and device type.',
    category: 'admin',
    isAdmin: true,
    isGroupOnly: true,
    async execute({ sock, chatId, message, args }) {
        try {
            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : null);

            if (!target) {
                return await sock.sendMessage(chatId, { text: '❌ *Usage:* Répond à un message ou mentionne quelqu\'un pour le "fingerprint".' });
            }

            await sock.sendMessage(chatId, { text: '📡 *Scan passif des paquets de métadonnées...* \nExtraction de la signature du client.' });

            // Heuristics for Fingerprinting
            const jid = target;
            const isLid = jid.includes('@lid');
            const messageId = message.message?.extendedTextMessage?.contextInfo?.stanzaId || '';

            let platform = 'Inconnu';
            let hardware = 'Générique';
            let confidence = 'Basse';

            // LID accounts are often associated with new business tools or specific desktop sessions
            if (isLid) {
                platform = 'WhatsApp Business / Web (LID)';
                hardware = 'Cloud/Desktop Emulator';
                confidence = 'Haute';
            }
            // Baileys IDs often start with 'BAE5' or similar unique strings
            else if (messageId.startsWith('BAE5')) {
                platform = 'Multi-Device (Script/Bot)';
                hardware = 'Linux/Node.js';
                confidence = 'Critique';
            }
            // Logic for common Message ID prefixes (these vary but can be indicative)
            else if (messageId.length === 20 || messageId.startsWith('3A')) {
                platform = 'iOS';
                hardware = 'Apple iPhone';
                confidence = 'Moyenne';
            }
            else if (messageId.length >= 24 && !messageId.includes('BAE')) {
                platform = 'Android';
                hardware = 'Mobile Device';
                confidence = 'Moyenne';
            }

            let report = `📊 *RAPPORT DE FINGERPRINTING* 📊\n\n`;
            report += `👤 *Cible:* @${target.split('@')[0]}\n`;
            report += `📱 *Plateforme:* ${platform}\n`;
            report += `💻 *Hardware:* ${hardware}\n`;
            report += `🔬 *Confiance:* ${confidence}\n\n`;

            report += `🛡️ *Note Technique:* L'analyse est basée sur les identifiants de stanza et la structure de l'ID de message (Protocol Signature Analysis).`;

            await sock.sendMessage(chatId, {
                text: report,
                mentions: [target]
            });

        } catch (error) {
            log.error('Error in FINGERPRINT command:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec du scan de signature.' });
        }
    }
};
