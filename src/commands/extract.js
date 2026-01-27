const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: 'extract',
    description: 'Extrait un média View Once.',
    category: 'admin',
    aliases: ['ext'],
    // OWNER ONLY
    execute: async ({ sock, message, bot, isOwner }) => {
        // Enforce Owner check within execution or rely on bot framework
        if (!isOwner) return; // Strict owner check

        try {
            const remoteJid = message.key.remoteJid;
            const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            if (!quotedMsg) {
                await sock.sendMessage(remoteJid, { text: "❌ Répondez à un message View Once (photo/vidéo) avec !extract" }, { quoted: message });
                return;
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
                await sock.sendMessage(remoteJid, { text: "❌ Ce message ne contient pas de média supporté." }, { quoted: message });
                return;
            }

            const mediaData = content[`${mediaType}Message`];
            if (!mediaData || !mediaData.mediaKey) {
                console.error(`[EXTRACT] Media key missing. Message might be undecryptable.`);
                await sock.sendMessage(remoteJid, { text: "❌ Impossible de lire le média (Erreur de décryptage).\n\n💡 *Solution:* Utilisez la commande *!logout* et rescannez le QR code pour synchroniser votre session." }, { quoted: message });
                return;
            }

            console.log(`[EXTRACT] Unpacking ${mediaType} for extraction...`);
            const stream = await downloadContentFromMessage(mediaData, mediaType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // ALWAYS Public: Send back to the current chat (User requested public reply)
            const caption = "🔓 *ViewOnce Extracted*";
            const targetJid = remoteJid;
            const options = { quoted: message, jpegThumbnail: null };

            if (mediaType === 'image') {
                await sock.sendMessage(targetJid, { image: buffer, caption }, options);
            } else if (mediaType === 'video') {
                await sock.sendMessage(targetJid, { video: buffer, caption }, options);
            } else if (mediaType === 'audio') {
                await sock.sendMessage(targetJid, { audio: buffer, mimetype: 'audio/mp4', ptt: true }, options);
            }

        } catch (err) {
            console.error('[EXTRACT] Error:', err.message);
            await sock.sendMessage(message.key.remoteJid, { text: "❌ Échec de l'extraction (Session expirée ou clé manquante)." }, { quoted: message });
        }
    }
};
