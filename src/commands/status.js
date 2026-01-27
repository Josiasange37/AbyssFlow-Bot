const fs = require("fs");
const path = require("path");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

module.exports = {
    name: "status",
    description: "Télécharge le statut d'un contact (répondre au statut avec la commande).",
    category: 'tools',
    aliases: ['statusdown', 'saver'],
    execute: async ({ sock, message, bot }) => {
        try {
            const remoteJid = message.key.remoteJid;

            // Vérifie si on répond à un message
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted) {
                await sock.sendMessage(remoteJid, { text: `* \`${bot.botName || 'Diane'}\` *\n\n⚠️ Vous devez répondre à un statut avec cette commande.` }, { quoted: message });
                return;
            }

            // Extraire le vrai message (peut être dans viewOnceMessage, ephemeralMessage, ou direct)
            let realMsg = quoted.viewOnceMessage?.message ||
                quoted.viewOnceMessageV2?.message ||
                quoted.ephemeralMessage?.message ||
                quoted;

            // Détecter le type de média
            const imageMsg = realMsg.imageMessage;
            const videoMsg = realMsg.videoMessage;

            if (!imageMsg && !videoMsg) {
                await sock.sendMessage(remoteJid, { text: `* \`${bot.botName || 'Diane'}\` *\n\n⚠️ Le message répondu n'est pas un statut photo ou vidéo.` }, { quoted: message });
                return;
            }

            const mediaType = imageMsg ? "image" : "video";
            const mediaMsg = imageMsg || videoMsg;

            const stream = await downloadContentFromMessage(mediaMsg, mediaType);
            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);

            const ext = mediaType === "video" ? "mp4" : "jpg";
            const downloadDir = path.join(__dirname, '../../downloads'); // Adjusted path
            if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

            const fileName = `status_${Date.now()}.${ext}`;
            const filePath = path.join(downloadDir, fileName);
            fs.writeFileSync(filePath, Buffer.concat(chunks));

            // Envoi du fichier
            const messageOptions = {};
            if (mediaType === "image") {
                messageOptions.image = { url: filePath };
            } else {
                messageOptions.video = { url: filePath };
            }
            messageOptions.caption = `* \`${bot.botName || 'Diane'}\` *\n\n✅ *Statut téléchargé avec succès !*`;

            await sock.sendMessage(remoteJid, messageOptions, { quoted: message });

            // Nettoyage immédiat
            try {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            } catch (e) {
                console.error('[Cleanup Error]:', e.message);
            }

        } catch (err) {
            console.error('[StatusDown Error]:', err);
            await sock.sendMessage(message.key.remoteJid, { text: "❌ Impossible de télécharger le statut." }, { quoted: message });
        }
    }
};
