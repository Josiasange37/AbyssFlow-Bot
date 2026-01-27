const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = {
    name: 'tovideo',
    description: 'Convertit un sticker animé en vidéo (MP4) ou GIF.',
    category: 'tools',
    aliases: ['tomp4', 'tov'],
    execute: async ({ sock, message, bot }) => {
        const remoteJid = message.key.remoteJid;
        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const uniqueId = Date.now();
        const tempInput = path.join(tempDir, `input_${uniqueId}.webp`);
        const tempOutput = path.join(tempDir, `output_${uniqueId}.mp4`);

        try {
            const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const contextInfo = message.message?.extendedTextMessage?.contextInfo;
            const messageWithMedia = quotedMsg || message.message;
            if (!messageWithMedia) return await sock.sendMessage(remoteJid, { text: `* \`${bot.botName || 'Diane'}\` *\n\n⚠️ Répondez à un sticker animé.` }, { quoted: message });

            const stickerMsg = messageWithMedia.stickerMessage;
            if (!stickerMsg) {
                return await sock.sendMessage(remoteJid, { text: `* \`${bot.botName || 'Diane'}\` *\n\n❌ Ce n'est pas un sticker.` }, { quoted: message });
            }

            // download
            const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            fs.writeFileSync(tempInput, buffer);

            // convert webp to mp4
            await new Promise((resolve, reject) => {
                ffmpeg(tempInput)
                    .outputOptions([
                        "-vcodec", "libx264",
                        "-pix_fmt", "yuv420p",
                        "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", // ensure dimensions are divisible by 2 for x264
                        "-preset", "fast",
                        "-crf", "28"
                    ])
                    .toFormat("mp4")
                    .save(tempOutput)
                    .on("end", () => resolve())
                    .on("error", (err) => reject(err));
            });

            await sock.sendMessage(remoteJid, { video: { url: tempOutput }, caption: `* \`${bot.botName || 'Diane'}\` *\n\n✅ *Conversion terminée*` }, { quoted: message });

        } catch (err) {
            console.error('[ToVideo Error]:', err);
            await sock.sendMessage(remoteJid, { text: `❌ Erreur lors de la conversion.` }, { quoted: message });
        } finally {
            try {
                if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
                if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
            } catch (e) { }
        }
    }
};
