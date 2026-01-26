const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: 'extract',
    description: 'Extrait un média View Once de manière anonyme.',
    category: 'tools',
    aliases: ['vv', 'viewonce'],
    execute: async ({ sock, message, args, bot }) => {
        try {
            const remoteJid = message.key.remoteJid;
            const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            // Helper function since we don't have replyWithTag in args
            const reply = async (text) => await sock.sendMessage(remoteJid, { text }, { quoted: message });

            if (!quotedMsg) {
                return reply("❌ Répondez à un message View Once (photo/vidéo) avec !extract");
            }

            // Unpack nested structures (Ephemeral -> ViewOnce -> Message)
            let content = quotedMsg;
            if (content.ephemeralMessage) content = content.ephemeralMessage.message;
            if (content.viewOnceMessage) content = content.viewOnceMessage.message;
            if (content.viewOnceMessageV2) content = content.viewOnceMessageV2.message;
            if (content.viewOnceMessageV2Extension) content = content.viewOnceMessageV2Extension.message;

            const mediaType = content.imageMessage ? 'image' :
                content.videoMessage ? 'video' :
                    content.audioMessage ? 'audio' : null;

            if (!mediaType) {
                return reply("❌ Ce message ne contient pas de média supporté.");
            }

            const mediaData = content[`${mediaType}Message`];
            if (!mediaData || !mediaData.mediaKey) {
                console.error(`[EXTRACT] Media key missing. Message might be undecryptable.`);
                return reply("❌ Impossible de lire le média (Erreur de décryptage).\n\n💡 *Solution:* Utilisez la commande *!logout* et rescannez le QR code pour synchroniser votre session.");
            }

            console.log(`[EXTRACT] Unpacking ${mediaType} for extraction...`);
            const stream = await downloadContentFromMessage(mediaData, mediaType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // ALWAYS Public: Send back to the current chat
            const caption = "� *[SYSTEM]* Media Recovered successfully.";
            const options = { quoted: message, jpegThumbnail: null };

            if (mediaType === 'image') {
                await sock.sendMessage(remoteJid, { image: buffer, caption }, options);
            } else if (mediaType === 'video') {
                await sock.sendMessage(remoteJid, { video: buffer, caption }, options);
            } else if (mediaType === 'audio') {
                await sock.sendMessage(remoteJid, { audio: buffer, mimetype: 'audio/mp4', ptt: true }, options);
            }

        } catch (err) {
            console.error('[EXTRACT] Error:', err.message);
            await sock.sendMessage(message.key.remoteJid, { text: "❌ Échec de l'extraction (Session expirée ou clé manquante)." }, { quoted: message });
        }
    }
};
