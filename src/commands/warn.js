const Warning = require('../database/models/Warning');

module.exports = {
    name: 'warn',
    description: 'Give a warning to a group member',
    isAdmin: true,
    isGroupOnly: true,
    async execute({ chatId, args, bot, message, sender }) {
        try {
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const target = message.message?.extendedTextMessage?.contextInfo?.participant || args[0]?.replace('@', '') + '@s.whatsapp.net';

            if (!target || target.includes('undefined')) {
                return await bot.sendMessage(chatId, { text: "Faut mentionner quelqu'un ou répondre à son message pour lui mettre un warn bg ! 🚩" }, { quoted: message });
            }

            if (target === bot.sock.user.id.split(':')[0] + '@s.whatsapp.net') {
                return await bot.sendMessage(chatId, { text: "Tu veux me warn moi ? 😂 T'es un marrant toi." }, { quoted: message });
            }

            const reason = args.join(' ') || "Non respect des règles du groupe";
            await bot.addWarning(chatId, target, reason);

        } catch (error) {
            console.error('Warn command error:', error);
            await bot.sendMessage(chatId, { text: "Erreur lors de l'attribution du warn... 🛠️" }, { quoted: message });
        }
    }
};
