const VoiceManager = require('../utils/VoiceManager');

module.exports = {
    name: 'say',
    description: 'Convertit le texte en audio (TTS Neural)',
    category: 'tools',
    async execute({ sock, chatId, args, message, bot }) {
        if (!args.length) {
            return await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Aide à l'utilisation*\nSpécifiez le contenu textuel : \`${bot.config?.prefix || '*'}say [texte]\`.` }, { quoted: message });
        }

        const text = args.join(' ');

        if (text.length > 500) {
            return await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Alerte*\nContenu textuel trop volumineux (Max 500 octets).` }, { quoted: message });
        }

        await sock.sendPresenceUpdate('recording', chatId);

        try {
            const audioPath = await VoiceManager.generateAudio(text);

            if (audioPath) {
                await bot.sendMessage(chatId, {
                    audio: { url: audioPath },
                    mimetype: 'audio/mpeg',
                    ptt: true
                }, { quoted: message });
            } else {
                await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Erreur*\nLe système de synthèse vocale ne répond pas.` }, { quoted: message });
            }
        } catch (error) {
            console.error('Say command error:', error);
            await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Interruption*\nUne erreur technique a suspendu la génération audio.` }, { quoted: message });
        }
    }
};
