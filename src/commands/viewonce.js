module.exports = {
    name: 'viewonce',
    aliases: ['revealvo', 'antiviewonce'],
    description: 'Reveal a view-once message',
    async execute({ sock, chatId, message, bot }) {
        try {
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted) {
                return await bot.sendSafeMessage(chatId, `faut répondre à une vue unique avec la commande bg.`);
            }

            let viewOnce = quoted.viewOnceMessage || quoted.viewOnceMessageV2 || quoted.viewOnceMessageV2Extension
                || quoted.ephemeralMessage?.message?.viewOnceMessage
                || quoted.ephemeralMessage?.message?.viewOnceMessageV2;

            if (!viewOnce) {
                return await bot.sendSafeMessage(chatId, `c'est pas une vue unique ça wesh.`);
            }

            const content = viewOnce.message;
            const mediaType = content.imageMessage ? 'image' : content.videoMessage ? 'video' : content.audioMessage ? 'audio' : null;

            if (!mediaType) {
                return await bot.sendSafeMessage(chatId, `format chelou, j'arrive pas à lire.`);
            }

            const sender = message.message.extendedTextMessage.contextInfo.participant || '';
            const caption = `Tu pensais cacher quoi? 👀\nDe: @${sender.split('@')[0]}`;

            let msgContent = {};
            if (mediaType === 'image') msgContent = { image: content.imageMessage.url ? { url: content.imageMessage.url } : content.imageMessage, caption };
            else if (mediaType === 'video') msgContent = { video: content.videoMessage.url ? { url: content.videoMessage.url } : content.videoMessage, caption };
            else if (mediaType === 'audio') msgContent = { audio: content.audioMessage.url ? { url: content.audioMessage.url } : content.audioMessage, mimetype: content.audioMessage.mimetype, ptt: content.audioMessage.ptt };

            msgContent.mentions = [sender];

            await bot.sendMessage(chatId, msgContent, { quoted: message });

        } catch (error) {
            await bot.sendSafeMessage(chatId, `oups, le message s'est autodétruit avant que je le chope.`);
        }
    }
};
