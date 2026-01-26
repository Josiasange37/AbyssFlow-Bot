const Persona = require('../core/brain/Persona');
const { log } = require('../utils/logger');

module.exports = {
    name: 'selfie',
    aliases: ['botpic', 'portrait'],
    description: 'Generate a consistent AI selfie of Diane',
    async execute({ chatId, args, bot, message }) {
        try {
            const scenarios = [
                'smiling at the camera',
                'working on a holographic code interface',
                'meditating in a digital zen garden',
                'looking mysteriously into the distance',
                'holding a glowing core of energy',
                'exploring a neon-lit cyber city',
                'standing heroically against a data storm',
                'playing with digital butterflies'
            ];

            const userScenario = args.join(' ');
            const scenario = userScenario || scenarios[Math.floor(Math.random() * scenarios.length)];

            await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Capture Identitaire*\nSynchronisation des couches visuelles en cours...` }, { quoted: message });

            const prompt = Persona.getBotVisualPrompt(scenario);
            const seed = Math.floor(Math.random() * 1000000);
            const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&model=flux`;

            await bot.sendMessage(chatId, {
                image: { url: imageUrl },
                caption: `* \`${bot.botName || 'Diane'}\` *\n\n*Portrait Réglementaire*\nScénario : \`${scenario}\``
            }, { quoted: message });

        } catch (error) {
            log.error('Selfie command failed:', error.message);
            await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Erreur*\nImpossible de finaliser la capture visuelle.` }, { quoted: message });
        }
    }
};
