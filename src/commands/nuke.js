const { log } = require('../utils/logger');

module.exports = {
    name: 'nuke',
    description: '☢️ Tactical Nuke: Clears the recent chat battlefield of all fraudulent traces.',
    category: 'admin',
    isAdmin: true,
    isOwner: true, // Restricted to owner for safety
    isGroupOnly: true,
    async execute({ sock, chatId, bot }) {
        try {
            await sock.sendMessage(chatId, { text: '☢️ *TACTICAL NUKE INCOMING...* \nAutorisation de niveau S confirmed.' });

            // Fetch recent messages from cache
            const cache = bot.messageCache;
            const messagesToDelete = [];

            cache.forEach((msg) => {
                if (msg.chatId === chatId) {
                    messagesToDelete.push({
                        remoteJid: chatId,
                        fromMe: false, // Target others
                        id: msg.id,
                        participant: msg.sender
                    });
                }
            });

            if (messagesToDelete.length === 0) {
                return await sock.sendMessage(chatId, { text: '✅ *Aucune cible ennemie dans le cache.*' });
            }

            // Only bot admin can delete others' messages
            const isBotAdmin = await bot.isBotGroupAdmin(chatId);
            if (!isBotAdmin) {
                return await sock.sendMessage(chatId, { text: '❌ *Erreur:* Le bot doit être ADMIN pour déclencher la NUKE.' });
            }

            let count = 0;
            const limit = Math.min(messagesToDelete.length, 50); // Limit to 50 for stability

            for (let i = 0; i < limit; i++) {
                try {
                    await sock.sendMessage(chatId, { delete: messagesToDelete[i] });
                    count++;
                } catch (e) { /* Ignore individual delete failures */ }
            }

            await sock.sendMessage(chatId, {
                text: `💥 *NUKE TERMINÉE.* \n${count} messages hostiles ont été atomisés. \n\n🛡️ _Périmètre AbyssFlow nettoyé._`
            });

        } catch (error) {
            log.error('Error in NUKE command:', error);
            await sock.sendMessage(chatId, { text: '❌ Erreur lors du déploiement de la nuke.' });
        }
    }
};
