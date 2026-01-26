const VoiceManager = require('../utils/VoiceManager');

module.exports = {
    name: 'say',
    description: 'Convertit le texte en audio (TTS Neural)',
    category: 'tools',
    async execute({ sock, chatId, args, message, bot }) {
        if (!args.length) {
            return await bot.sendMessage(chatId, { text: '❌ *Usage:* `*say Votre texte ici`' }, { quoted: message });
        }

        const text = args.join(' ');

        // Limit length to avoid abuse
        if (text.length > 500) {
            return await bot.sendMessage(chatId, { text: '❌ Texte trop long (max 500 caractères).' }, { quoted: message });
        }

        await sock.sendPresenceUpdate('recording', chatId);

        try {
            const audioPath = await VoiceManager.generateAudio(text);

            if (audioPath) {
                await bot.sendMessage(chatId, {
                    audio: { url: audioPath },
                    mimetype: 'audio/mpeg',
                    ptt: true // Send as voice note
                }, { quoted: message });
            } else {
                await bot.sendMessage(chatId, { text: '❌ Erreur de génération audio.' }, { quoted: message });
            }
        } catch (error) {
            console.error('Say command error:', error);
            await bot.sendMessage(chatId, { text: '❌ Une erreur est survenue.' }, { quoted: message });
        }
    }
};
