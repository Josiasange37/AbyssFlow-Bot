const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = {
  name: 'sticker',
  description: 'Convertit une image, GIF ou vidéo en sticker.',
  category: 'tools',
  aliases: ['s', 'stick'],
  execute: async ({ sock, message, bot }) => {
    const remoteJid = message.key.remoteJid;
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const uniqueId = Date.now();
    const tempInput = path.join(tempDir, `input_${uniqueId}`);
    const tempOutput = path.join(tempDir, `output_${uniqueId}.webp`);

    try {
      const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const contextInfo = message.message?.extendedTextMessage?.contextInfo;
      const messageWithMedia = quotedMsg || message.message;
      if (!messageWithMedia) return await sock.sendMessage(remoteJid, { text: `* \`${bot.botName || 'Diane'}\` *\n\n⚠️ Envoyez ou répondez à une image/vidéo.` }, { quoted: message });

      const mediaType = messageWithMedia.imageMessage ? 'image' :
        messageWithMedia.videoMessage ? 'video' : null;

      if (!mediaType) {
        return await sock.sendMessage(remoteJid, { text: `* \`${bot.botName || 'Diane'}\` *\n\n❌ Format non supporté.` }, { quoted: message });
      }

      // download
      const stream = await downloadContentFromMessage(messageWithMedia[`${mediaType}Message`], mediaType);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

      fs.writeFileSync(tempInput, buffer);

      // convert
      await new Promise((resolve, reject) => {
        ffmpeg(tempInput)
          .outputOptions([
            "-vcodec", "libwebp",
            "-vf", "scale='min(512,iw)':'min(512,ih)':force_original_aspect_ratio=decrease,fps=15, pad=512:512:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
            "-loop", "0", "-preset", "default", "-an", "-vsync", "0"
          ])
          .toFormat("webp")
          .save(tempOutput)
          .on("end", () => resolve())
          .on("error", (err) => reject(err));
      });

      await sock.sendMessage(remoteJid, { sticker: { url: tempOutput } }, { quoted: message });

    } catch (err) {
      console.error('[Sticker Error]:', err);
      await sock.sendMessage(remoteJid, { text: `❌ Erreur lors de la création du sticker.` }, { quoted: message });

      // Fallback: send original if sticker fail? (Optional, maybe not needed per request)

    } finally {
      try {
        if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
        if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
      } catch (e) { }
    }
  }
};
