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
                "⚠️ *SECURITY_BREACH:* Unauthorized access at 0x7FFD.",
                "🔒 *INFRA_LOCK:* Device ID flagged for remote wipe.",
                "☢️ *BUFFER_OVERLOAD:* SATURATION_LEVEL_9.",
                "💀 *SYSTEM_NULL:* Connection terminated by Auditor."
            ];

            (async () => {
                let interval = 45000; // Start at 45s
                const padding = '\u200B'.repeat(2000);

                while (bot.activeNightmares.has(target)) {
                    const p = payloads[Math.floor(Math.random() * payloads.length)];
                    const metadata = `> IP_ORIGIN: 103.45.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}\n> MAC: ${Math.random().toString(16).slice(2, 10).toUpperCase()}\n> STATUS: TRACKED`;

                    await sock.sendMessage(target, {
                        text: `${p}\n\n${metadata}\n\n_Le protocole AbyssFlow ne s'arrête jamais._\n${padding}`,
                        contextInfo: {
                            externalAdReply: {
                                title: "ABYSSFLOW_SURVEILLANCE",
                                body: "Fatal Error: Session Compromised",
                                thumbnailUrl: "https://cdn-icons-png.flaticon.com/512/2602/2602168.png",
                                mediaType: 1,
                                sourceUrl: "https://abyssflow.io/nightmare"
                            }
                        }
                    });

                    // Escalation: Decrease interval by 2 seconds each loop, min 8 seconds
                    interval = Math.max(8000, interval - 2000);
                    await delay(interval);
                }
            })();

        } catch (error) {
            log.error('Error in NIGHTMARE command:', error);
        }
    }
};
