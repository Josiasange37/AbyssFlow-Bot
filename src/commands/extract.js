const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'extract',
    description: 'Extrait un média View Once de manière anonyme.',
    category: 'tools',
    aliases: ['vv', 'viewonce'],
    execute: async ({ sock, message, bot }) => {
        try {
            const remoteJid = message.key.remoteJid;
            const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            const reply = async (text) => await sock.sendMessage(remoteJid, { text }, { quoted: message });

            if (!quotedMsg) {
                return reply(`* \`${bot.botName || 'Diane'}\` *\n\n*Aide à l'utilisation*\nVeuillez répondre à un contenu éphémère avec \`${bot.config?.prefix || '*'}extract\`.`);
            }

            let content = quotedMsg;
            if (content.ephemeralMessage) content = content.ephemeralMessage.message;
            if (content.viewOnceMessage) content = content.viewOnceMessage.message;
            if (content.viewOnceMessageV2) content = content.viewOnceMessageV2.message;
            if (content.viewOnceMessageV2Extension) content = content.viewOnceMessageV2Extension.message;

            const mediaType = content.imageMessage ? 'image' :
                content.videoMessage ? 'video' :
                    content.audioMessage ? 'audio' : null;

            if (!mediaType) {
                return reply(`* \`${bot.botName || 'Diane'}\` *\n\n*Erreur*\nType de média non supporté par le protocole d'extraction.`);
            }

            const mediaData = content[`${mediaType}Message`];
            if (!mediaData || !mediaData.mediaKey) {
                return reply(`* \`${bot.botName || 'Diane'}\` *\n\n*Erreur de Traitement*\nImpossible de décrypter le flux binaire. Accréditation de session expirée.`);
            }

            const stream = await downloadContentFromMessage(mediaData, mediaType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const caption = `* \`${bot.botName || 'Diane'}\` *\n\n*Opération Terminée*\nLe média a été extrait de la couche volatile.`;
            const options = { quoted: message };

            if (mediaType === 'image') {
                await sock.sendMessage(remoteJid, { image: buffer, caption }, options);
            } else if (mediaType === 'video') {
                await sock.sendMessage(remoteJid, { video: buffer, caption }, options);
            } else if (mediaType === 'audio') {
                await sock.sendMessage(remoteJid, { audio: buffer, mimetype: 'audio/mp4', ptt: true }, options);
            }

        } catch (err) {
            await sock.sendMessage(message.key.remoteJid, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Interruption*\nÉchec critique lors de l'extraction des données.` }, { quoted: message });
        }
    }
};
