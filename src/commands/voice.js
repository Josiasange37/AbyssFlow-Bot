const GroupSettings = require('../database/models/GroupSettings');
const mongoose = require('mongoose');
const LocalSettings = require('../database/LocalSettings');

module.exports = {
    name: 'voice',
    description: 'Active/Désactive les réponses vocales automatiques de Diane.',
    category: 'admin',
    isAdmin: true,
    isGroupOnly: true,
    async execute({ sock, chatId, args, message, bot }) {
        const action = args[0]?.toLowerCase();

        if (action !== 'on' && action !== 'off') {
            return await bot.sendMessage(chatId, { text: '❌ *Usage:* `*voice on` ou `*voice off`' }, { quoted: message });
        }

        const isVoiceOn = (action === 'on');

        try {
            // Check DB connection
            if (mongoose.connection.readyState === 1) {
                // MongoDB Online
                const settings = await GroupSettings.findOne({ groupId: chatId }).maxTimeMS(2000) || new GroupSettings({ groupId: chatId });
                settings.voiceEnabled = isVoiceOn;
                await settings.save();
            } else {
                // MongoDB Offline -> Use Local JSON
                LocalSettings.set(chatId, { voiceEnabled: isVoiceOn });
            }

            const status = isVoiceOn ? 'ACTIVÉ ✅' : 'DÉSACTIVÉ ❌';
            const mode = mongoose.connection.readyState === 1 ? '(Cloud)' : '(Local)';

            await bot.sendMessage(chatId, {
                text: `🎙️ *MODE VOCAL ${status}* ${mode}\n\nDiane pourra désormais répondre par notes vocales si elle le juge nécessaire.`
            }, { quoted: message });

        } catch (error) {
            console.error('Voice toggle error:', error);
            await bot.sendMessage(chatId, { text: '❌ Erreur lors du changement de paramètre.' }, { quoted: message });
        }
    }
};
