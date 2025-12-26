const { log } = require('../utils/logger');
const sharp = require('sharp');
const axios = require('axios');

module.exports = {
    name: 'triggered',
    aliases: ['tg', 'trigger'],
    description: 'Apply a triggered effect to a profile picture or image',
    async execute({ chatId, message, bot, sender }) {
        try {
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            let targetImage = null;

            if (quoted?.imageMessage) {
                targetImage = await bot.downloadMedia(quoted.imageMessage, 'image');
            } else if (message.message?.imageMessage) {
                targetImage = await bot.downloadMedia(message.message.imageMessage, 'image');
            } else {
                // If no image, use the sender's (or target's) PFP
                const target = sender;
                try {
                    const ppUrl = await bot.sock.profilePictureUrl(target, 'image');
                    const response = await axios.get(ppUrl, { responseType: 'arraybuffer' });
                    targetImage = Buffer.from(response.data);
                } catch (e) {
                    return await bot.sendMessage(chatId, { text: "Envoie une image ou réponds à une pour que je la trigger bg ! 💢" }, { quoted: message });
                }
            }

            await bot.sendMessage(chatId, { text: "💢 *TRIGGERING INTENSIFIES*... 💢" }, { quoted: message });

            const info = await sharp(targetImage).metadata();

            // Create the triggered overlay
            const svgOverlay = Buffer.from(`
                <svg width="${info.width}" height="${info.height}">
                    <rect width="100%" height="100%" fill="rgba(255,0,0,0.4)"/>
                    <rect y="${info.height - 80}" width="100%" height="80" fill="white" opacity="0.8"/>
                    <text x="50%" y="${info.height - 25}" font-family="Arial" font-weight="bold" font-size="60" fill="red" text-anchor="middle">TRIGGERED</text>
                </svg>
            `);

            const result = await sharp(targetImage)
                .modulate({ brightness: 1.2, saturation: 1.5 })
                .composite([{ input: svgOverlay, blend: 'over' }])
                .png()
                .toBuffer();

            await bot.sendMessage(chatId, {
                image: result,
                caption: `CHILL MOLA ! 😂💢`
            }, { quoted: message });

        } catch (error) {
            log.error('Trigger command failed:', error.message);
            await bot.sendMessage(chatId, { text: "Impossible de trigger ça... 🛠️" }, { quoted: message });
        }
    }
};
