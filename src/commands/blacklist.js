const { log } = require('../utils/logger');
const Blacklist = require('../database/models/Blacklist');

module.exports = {
    name: 'blacklist',
    description: '🚫 Global Interdiction List: Adds a target to the persistent purge list.',
    category: 'admin',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, message, args, sender }) {
        try {
            const action = args[0]?.toLowerCase(); // add, remove, list
            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[1] ? args[1].replace('@', '') + '@s.whatsapp.net' : null);

            if (action === 'add' && target) {
                const reason = args.slice(2).join(' ') || 'Danger Protocolaire Détecté';
                await Blacklist.findOneAndUpdate(
                    { userId: target },
                    { reason, addedBy: sender },
                    { upsert: true }
                );
                return await sock.sendMessage(chatId, { text: `🚫 *TARGET ADDED TO BLACKLIST* 🚫\n\n👤 *Cible:* @${target.split('@')[0]}\n🚩 *Raison:* ${reason}\n\n_Interdiction globale activée._`, mentions: [target] });
            }

            if (action === 'remove' && target) {
                await Blacklist.deleteOne({ userId: target });
                return await sock.sendMessage(chatId, { text: `✅ *TARGET REMOVED FROM BLACKLIST* \n\n@${target.split('@')[0]} a été réhabilité.`, mentions: [target] });
            }

            if (action === 'list') {
                const list = await Blacklist.find();
                if (list.length === 0) return await sock.sendMessage(chatId, { text: '✅ *Aucune cible dans la Blacklist.*' });

                let report = `🚫 *INDEX D'INTERDICTION ABYSSFLOW* 🚫\n\n`;
                list.forEach((item, i) => {
                    report += `${i + 1}. @${item.userId.split('@')[0]} - ${item.reason}\n`;
                });
                return await sock.sendMessage(chatId, { text: report, mentions: list.map(l => l.userId) });
            }

            await sock.sendMessage(chatId, {
                text: '❌ *Usage:* \n`*blacklist add @user <raison>`\n`*blacklist remove @user`\n`*blacklist list`'
            });

        } catch (error) {
            log.error('Error in BLACKLIST command:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec de la gestion de la blacklist.' });
        }
    }
};
