module.exports = {
    name: 'revoke',
    aliases: ['resetlink'],
    description: 'Reset the group invite link',
    isAdmin: true,
    isGroupOnly: true,
    async execute({ chatId, bot, message }) {
        try {
            await bot.sock.groupRevokeInvite(chatId);
            await bot.sendMessage(chatId, { text: "✅ Lien du groupe réinitialisé avec succès ! 🛡️" }, { quoted: message });
        } catch (error) {
            console.error('Revoke error:', error);
            await bot.sendMessage(chatId, { text: "Échec de la réinitialisation du lien. Vérifie mes permissions admin ! 🛠️" }, { quoted: message });
        }
    }
};
