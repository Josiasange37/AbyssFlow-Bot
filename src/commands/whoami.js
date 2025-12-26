const { normalizeNumber } = require('../utils/helpers');

module.exports = {
    name: 'whoami',
    description: 'Show your account information',
    async execute({ chatId, message, bot, sender, isOwner, isGroup, isGroupAdmin, canUseAdminCommands }) {
        const whoamiMsg = [
            `*🔍 Informations de Votre Compte*`,
            '',
            `📱 *Votre JID:*`,
            `\`${sender}\``,
            '',
            `🔢 *Numéro Normalisé:*`,
            `\`${normalizeNumber(sender)}\``,
            '',
            `🔐 *Permissions:*`,
            `• Propriétaire: ${isOwner ? '✅' : '❌'}`,
            `• Admin du groupe: ${isGroup && isGroupAdmin ? '✅' : (isGroup ? '❌' : 'N/A')}`,
            `• Peut utiliser commandes admin: ${canUseAdminCommands ? '✅' : '❌'}`,
            '',
            `💡 *Utilisez cette info pour le debug*`
        ].join('\n');

        await bot.sendSafeMessage(chatId, whoamiMsg, {
            isCommandResponse: true,
            title: 'WHO AM I',
            type: 'info',
            quotedMessage: message
        });
    }
};
