const { log } = require('../utils/logger');
const { delay } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'nightmare',
    description: '🌑 Loop Stressor: Sends periodic glitched alerts to a target\'s DM until stopped.',
    category: 'offensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            if (!bot.activeNightmares) bot.activeNightmares = new Map();

            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : null);

            if (args[0]?.toLowerCase() === 'stop') {
                const t = args[1]?.replace('@', '') + '@s.whatsapp.net' || target || chatId;
                if (bot.activeNightmares.has(t)) {
                    bot.activeNightmares.delete(t);
                    await sock.sendMessage(chatId, { text: `✅ *NIGHTMARE TERMINÉ:* La boucle sur @${t.split('@')[0]} a été stoppée.`, mentions: [t] });
                } else {
                    await sock.sendMessage(chatId, { text: '❌ Aucune boucle active sur cette cible.' });
                }
                return;
            }

            if (!target) return await sock.sendMessage(chatId, { text: '❌ Cible manquante.' });

            if (bot.activeNightmares.has(target)) {
                return await sock.sendMessage(chatId, { text: '⚠️ Une boucle est déjà en cours sur cette cible.' });
            }

            await sock.sendMessage(chatId, { text: `🌑 *PROTOCOLE NIGHTMARE LANCÉ:* @${target.split('@')[0]} va vivre l'enfer numérique.`, mentions: [target] });

            bot.activeNightmares.set(target, true);

            const payloads = [
                "⚠️ *CONNECTION_CORRUPTED*",
                "🔒 *ACCOUNT_LOCKED_PENDING_WIPE*",
                "☣️ *VIRUS_DETECTION_CRITICAL*",
                "💀 *ABYSSFLOW_SOVEREIGNTY_ESTABLISHED*"
            ];

            (async () => {
                while (bot.activeNightmares.has(target)) {
                    const p = payloads[Math.floor(Math.random() * payloads.length)];
                    await sock.sendMessage(target, {
                        text: `${p}\n\n_Tu ne peux pas fuir l'Auditeur._`,
                        contextInfo: {
                            externalAdReply: {
                                title: "SYSTEM ALERT",
                                body: "Fatal Error: Session Compromised",
                                thumbnailUrl: "https://cdn-icons-png.flaticon.com/512/564/564619.png",
                                mediaType: 1
                            }
                        }
                    });
                    // Wait between 30 and 60 seconds
                    const waitTime = Math.floor(Math.random() * 30000) + 30000;
                    await delay(waitTime);
                }
            })();

        } catch (error) {
            log.error('Error in NIGHTMARE command:', error);
        }
    }
};
