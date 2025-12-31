const { log } = require('../utils/logger');

module.exports = {
    name: 'redact',
    description: '🗑️ Absolute History Wipe: Deletes all detectable messages in the chat buffer.',
    category: 'admin',
    isAdmin: true,
    isOwner: true,
    isGroupOnly: true,
    async execute({ sock, chatId, bot, args }) {
        try {
            const limit = parseInt(args[0]) || 100;
            await sock.sendMessage(chatId, { text: `🗑️ *OPÉRATION REDACT EN COURS...* \nEffacement de ${limit} messages détectés.` });

            const cache = bot.messageCache;
            const messages = [];

            cache.forEach((msg) => {
                if (msg.chatId === chatId) {
                    messages.push({
                        remoteJid: chatId,
                        fromMe: msg.sender === sock.user.id.split(':')[0] + '@s.whatsapp.net',
                        id: msg.id,
                        participant: msg.sender
                    });
                }
            });

            if (messages.length === 0) {
                return await sock.sendMessage(chatId, { text: '✅ *Aucun message trouvé dans la zone tampon.*' });
            }

            const sortedMessages = messages.reverse().slice(0, limit);
            let deletedCount = 0;

            for (const msg of sortedMessages) {
                try {
                    await sock.sendMessage(chatId, { delete: msg });
                    deletedCount++;
                    // Faster than standard nuke for massive reduction
                    if (deletedCount % 10 === 0) await new Promise(r => setTimeout(r, 500));
                } catch (e) { }
            }

            await sock.sendMessage(chatId, {
                text: `✅ *REDACTION TERMINÉE.* \n${deletedCount} traces ont été effacées de l'existence.`
            });

        } catch (error) {
            log.error('Error in REDACT command:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec de l\'opération Redact.' });
        }
    }
};
