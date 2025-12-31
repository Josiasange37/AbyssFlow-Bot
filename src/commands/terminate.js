const { log } = require('../utils/logger');
const Blacklist = require('../database/models/Blacklist');

module.exports = {
    name: 'terminate',
    description: '💀 Absolute Target Removal: Kicks, wipes messages, and blacklists the target.',
    category: 'admin',
    isAdmin: true,
    isOwner: true,
    isGroupOnly: true,
    async execute({ sock, chatId, bot, args, message, sender }) {
        try {
            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : null);

            if (!target) {
                return await sock.sendMessage(chatId, { text: '❌ *Usage:* Répond ou mentionne la cible pour la "terminer".' });
            }

            await sock.sendMessage(chatId, { text: `💀 *ORDRE DE TERMINAISON REÇU* 💀\n\nExécution du protocole de suppression absolue pour @${target.split('@')[0]}...`, mentions: [target] });

            // 1. Blacklist
            await Blacklist.findOneAndUpdate(
                { userId: target },
                { reason: 'Exécution par Terminate Protocol', addedBy: sender },
                { upsert: true }
            );

            // 2. Wipe Messages
            const cache = bot.messageCache;
            let wipeCount = 0;
            cache.forEach(async (msg) => {
                if (msg.chatId === chatId && msg.sender === target) {
                    try { await sock.sendMessage(chatId, { delete: { remoteJid: chatId, fromMe: false, id: msg.id, participant: target } }); wipeCount++; } catch (e) { }
                }
            });

            // 3. Kick
            const isBotAdmin = await bot.isBotGroupAdmin(chatId);
            if (isBotAdmin) {
                await sock.groupParticipantsUpdate(chatId, [target], 'remove');
            }

            await sock.sendMessage(chatId, {
                text: `✅ *CIBLE TERMINÉE.* \n- Blacklist: OK\n- Messages effacés: ${wipeCount}\n- Expulsion: ${isBotAdmin ? 'OK' : 'FAIL (Bot not admin)'}\n\n_Adios mola._ 💨`
            });

        } catch (error) {
            log.error('Error in TERMINATE command:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec de la terminaison.' });
        }
    }
};
