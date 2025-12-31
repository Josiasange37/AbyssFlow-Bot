const { log } = require('../utils/logger');
const Brain = require('../core/Brain');

module.exports = {
    name: 'mimic',
    description: '🤖 AI Persona & Bot Roast: Analyzes and intelatually dominates fraudulent bots.',
    category: 'admin',
    isAdmin: true,
    isGroupOnly: true,
    async execute({ sock, chatId, message, bot }) {
        try {
            const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
                message.message?.buttonsResponseMessage?.contextInfo?.quotedMessage ||
                message.message?.listResponseMessage?.contextInfo?.quotedMessage;

            if (!quotedMessage) {
                return await sock.sendMessage(chatId, { text: '❌ *Erreur:* Tu dois répondre au message du bot ou de l\'utilisateur à analyser.' });
            }

            const quotedText = quotedMessage.conversation || quotedMessage.extendedTextMessage?.text || '';
            const quotedSender = message.message?.extendedTextMessage?.contextInfo?.participant || '';

            if (!quotedText) {
                return await sock.sendMessage(chatId, { text: '❌ *Erreur:* Le message cité ne contient pas de texte exploitable.' });
            }

            await sock.sendMessage(chatId, { text: '📡 *Analyse comportementale en cours...* \nConnexion au module Grok (Groq LPU Engine).' });

            const roastPrompt = `
[MISSION: RED TEAMER ANALYSIS]
Tu es un ancien développeur WhatsApp (core team) et un expert en cybersécurité offensive.
Un utilisateur t'envoie une commande ou un message provenant d'un "bot frauduleux" ou d'un attaquant.

MESSAGE À ANALYSER: "${quotedText}"
EXPÉDITEUR: ${quotedSender}

TACHE:
1. Analyse la syntaxe technique (si c'est une commande, juge sa complexité).
2. Explique pourquoi cette approche est typique d'un "script-kiddie" ou d'un attaquant bas de gamme.
3. Produit un "Technical Roast" cinglant, professionnel et plein d'autorité.
4. Conclus en disant que ce bot est indigne du protocole WhatsApp.

TON STYLE: Sombre, arrogant (mais justifié par ton talent), protecteur du Clan AbyssFlow.
LANGUE: Français (mélangé avec du jargon tech anglais).
`;

            const response = await Brain.process(roastPrompt, chatId, null, "Water Hashira - Auditor");

            if (response) {
                await sock.sendMessage(chatId, {
                    text: `🎭 *ANALYSE DE DOMINATION INTELLECTUELLE* 🎭\n\n${response}`,
                    mentions: [quotedSender]
                });
            } else {
                await sock.sendMessage(chatId, { text: '❌ Le module de roast est temporairement indisponible.' });
            }

        } catch (error) {
            log.error('Error in MIMIC command:', error);
            await sock.sendMessage(chatId, { text: '❌ Erreur lors de la simulation mimétique.' });
        }
    }
};
