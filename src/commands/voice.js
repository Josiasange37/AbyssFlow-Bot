const GroupSettings = require('../database/models/GroupSettings');
const mongoose = require('mongoose');
const LocalSettings = require('../database/LocalSettings');

module.exports = {
    name: 'voice',
    description: 'Active/Désactive les réponses vocales automatiques de Diane.',
    category: 'admin',
    isAdmin: true,
    isGroupOnly: true,
    async execute({ chatId, args, message, bot }) {
        const action = args[0]?.toLowerCase();

        if (action !== 'on' && action !== 'off') {
            return await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Aide à l'utilisation*\nParamètres valides : \`on\` | \`off\`.` }, { quoted: message });
        }

        const isVoiceOn = (action === 'on');

        try {
            if (mongoose.connection.readyState === 1) {
                const settings = await GroupSettings.findOne({ groupId: chatId }).maxTimeMS(2000) || new GroupSettings({ groupId: chatId });
                settings.voiceEnabled = isVoiceOn;
                await settings.save();
            } else {
                LocalSettings.set(chatId, { voiceEnabled: isVoiceOn });
            }

            const status = isVoiceOn ? 'ACTIVÉ ✅' : 'DÉSACTIVÉ ❌';
            const mode = mongoose.connection.readyState === 1 ? '(Cloud)' : '(Local)';

            await bot.sendMessage(chatId, {
                text: `* \`${bot.botName || 'Diane'}\` *\n\n*Paramètre Vocal : ${status}*\nInterface audio synchronisée ${mode}.`
            }, { quoted: message });

        } catch (error) {
            console.error('Voice toggle error:', error);
            await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Erreur*\nÉchec de la synchronisation des paramètres vocaux.` }, { quoted: message });
        }
    }
};
