const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: 'mute',
    description: 'Mute a user in the group (removes their messages automatically)',
    isAdmin: true,
    isGroupOnly: true,
    async execute({ chatId, message, args, bot }) {
        try {
            const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
                message.message?.extendedTextMessage?.contextInfo?.participant;

            if (!mentioned) {
                return await bot.sendMessage(chatId, { text: "Mentionne le fauteur de trouble pour le mute mola ! 🤫" }, { quoted: message });
            }

            // Simple mute implementation: Add to a local file/set
            // In a real app, this should be in MongoDB
            const mutedId = mentioned;

            // We'll use PsychoBot's internal mute set
            if (!bot.mutedUsers) bot.mutedUsers = new Map();

            // Default 30 mins if no time provided, or use custom time
            const duration = parseInt(args[0]) || 30; // in minutes
            const expiry = Date.now() + (duration * 60 * 1000);

            if (!bot.mutedUsers.has(chatId)) bot.mutedUsers.set(chatId, new Set());

            const mutedList = bot.mutedUsers.get(chatId);
            mutedList.add(mutedId);

            await bot.sendMessage(chatId, {
                text: `🤫 *@${mutedId.split('@')[0]} est maintenant réduit au silence pour ${duration} minutes.* \n\nPsycho Bo va supprimer ses messages automatiquement. 🛡️⚔️`,
                mentions: [mutedId]
            });

            // Auto-unmute after duration
            setTimeout(() => {
                const list = bot.mutedUsers.get(chatId);
                if (list) list.delete(mutedId);
                // Optional: notify unmute
            }, duration * 60 * 1000);

        } catch (error) {
            console.error('Mute error:', error);
            await bot.sendMessage(chatId, { text: "Erreur lors du mute... 🛠️" }, { quoted: message });
        }
    }
};
