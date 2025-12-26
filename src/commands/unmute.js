module.exports = {
    name: 'unmute',
    description: 'Unmute a user in the group',
    isAdmin: true,
    isGroupOnly: true,
    async execute({ chatId, message, bot }) {
        try {
            const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
                message.message?.extendedTextMessage?.contextInfo?.participant;

            if (!mentioned) {
                return await bot.sendMessage(chatId, { text: "Mentionne celui que tu veux libérer bg ! 🕊️" }, { quoted: message });
            }

            if (bot.mutedUsers && bot.mutedUsers.has(chatId)) {
                bot.mutedUsers.get(chatId).delete(mentioned);
                await bot.sendMessage(chatId, {
                    text: `🕊️ *@${mentioned.split('@')[0]} a retrouvé sa liberté d'expression. Sois sage maintenant ! 🤙*`,
                    mentions: [mentioned]
                });
            } else {
                await bot.sendMessage(chatId, { text: "Ce gars n'est même pas mute mola. 😂" });
            }

        } catch (error) {
            console.error('Unmute error:', error);
            await bot.sendMessage(chatId, { text: "Erreur lors du unmute... 🛠️" }, { quoted: message });
        }
    }
};
