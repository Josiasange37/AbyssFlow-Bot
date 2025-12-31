const { log } = require('../utils/logger');

module.exports = {
    name: 'vex',
    description: '💀 Automated AI Harassment: Triggers a technical roast for every message from the target.',
    category: 'admin',
    isAdmin: true,
    isOwner: true,
    isGroupOnly: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : null);

            if (!target) {
                return await sock.sendMessage(chatId, { text: '❌ *Usage:* Répond ou mentionne la cible pour la "vexer".' });
            }

            if (!bot.vexedUsers) bot.vexedUsers = new Map();
            let chatVexed = bot.vexedUsers.get(chatId) || new Set();

            if (chatVexed.has(target)) {
                chatVexed.delete(target);
                bot.vexedUsers.set(chatId, chatVexed);
                return await sock.sendMessage(chatId, { text: `🛡️ *CESSEZ-LE-FEU:* @${target.split('@')[0]} n'est plus vexé.`, mentions: [target] });
            }

            chatVexed.add(target);
            bot.vexedUsers.set(chatId, chatVexed);

            await sock.sendMessage(chatId, {
                text: `💀 *PROTOCOLE VEX ACTIVÉ* 💀\n\n👤 *Cible:* @${target.split('@')[0]}\n🚩 *Status:* HARCÈLEMENT INTELLIGENT\n\n_Le bot humiliera cette cible à chaque interaction._`,
                mentions: [target]
            });

        } catch (error) {
            log.error('Error in VEX command:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec du protocole Vex.' });
        }
    }
};
