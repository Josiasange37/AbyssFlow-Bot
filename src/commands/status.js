const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const puppeteer = require('puppeteer');

module.exports = {
    name: 'status',
    description: 'Télécharge le statut WhatsApp (Photo/Vidéo/Texte). Répondez au statut ou mentionnez l\'utilisateur.',
    category: 'tools',
    aliases: ['statusdown', 'saver'],
    execute: async ({ sock, message, bot, args }) => {
        try {
            const remoteJid = message.key.remoteJid;
            const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const contextInfo = message.message?.extendedTextMessage?.contextInfo;

            // 1. Determine Target Status
            let targetStatus = null;
            let targetJid = null;

            // A. Reaction/Reply Mode
            if (quotedMsg) {
                targetStatus = quotedMsg;
                // If replying to a status broadcast directly
                if (contextInfo.remoteJid === 'status@broadcast') {
                    // The quoted content IS the status
                }
            }
            // B. Tag Mode (using Cache)
            else if (contextInfo?.mentionedJid?.length > 0) {
                targetJid = contextInfo.mentionedJid[0];
                const cached = bot.statusCache.get(targetJid);
                if (cached && cached.message) {
                    targetStatus = cached.message;
                } else {
                    return await sock.sendMessage(remoteJid, { text: `* \`${bot.botName || 'Diane'}\` *\n\n⚠️ Aucun statut récent trouvé en cache pour @${targetJid.split('@')[0]} (Bot doit être en ligne lors de la publication).`, mentions: [targetJid] }, { quoted: message });
                }
            }
            // C. Fallback
            else {
                return await sock.sendMessage(remoteJid, { text: `* \`${bot.botName || 'Diane'}\` *\n\n⚠️ Usage:\n- Répondez à un statut\n- Ou: \`*status @user\`` }, { quoted: message });
            }

            if (!targetStatus) return;

            // Deep extract content
            let content = targetStatus;
            content = content.ephemeralMessage?.message || content;
            content = content.viewOnceMessage?.message || content;
            content = content.viewOnceMessageV2?.message || content;
            content = content.viewOnceMessageV2Extension?.message || content;
            content = content.documentWithCaptionMessage?.message || content;

            // 2. Handle Content Types
            // Type A: Media (Image/Video)
            const mediaType = content.imageMessage ? 'image' :
                content.videoMessage ? 'video' : null;

            if (mediaType) {
                const mediaData = content[`${mediaType}Message`];
                const stream = await downloadContentFromMessage(mediaData, mediaType);
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

                await sock.sendMessage(remoteJid, { [mediaType]: buffer, caption: `* \`${bot.botName || 'Diane'}\` *\n\n✅ *Statut Sauvegardé*` }, { quoted: message });
                return;
            }

            // Type B: Text Status (Screenshot)
            const textContent = content.extendedTextMessage?.text || content.conversation;
            if (textContent) {
                // Use Puppeteer to screenshot text
                const browser = await puppeteer.launch({
                    headless: 'new',
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
                const page = await browser.newPage();

                // Set viewport to resemble a phone status
                await page.setViewport({ width: 1080, height: 1920 });

                // Create a colorful HTML Background
                // WhatsApp statuses have random background colors. We'll pick a nice gradient.
                const htmlContent = `
                <html>
                    <body style="margin:0; padding:0; display:flex; justify-content:center; align-items:center; height:100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: sans-serif;">
                        <div style="font-size: 80px; font-weight: bold; color: white; text-align: center; padding: 60px; word-wrap: break-word; max-width: 90%;">
                            ${textContent.replace(/\n/g, '<br>')}
                        </div>
                    </body>
                </html>`;

                await page.setContent(htmlContent);
                const screenshotBuffer = await page.screenshot();
                await browser.close();

                await sock.sendMessage(remoteJid, { image: screenshotBuffer, caption: `* \`${bot.botName || 'Diane'}\` *\n\n📸 *Statut Texte*` }, { quoted: message });
                return;
            }

            // Fallback
            await sock.sendMessage(remoteJid, { text: `* \`${bot.botName || 'Diane'}\` *\n\n❌ Format de statut non supporté/trouvé.` }, { quoted: message });

        } catch (err) {
            console.error('[Status Error]:', err);
            await sock.sendMessage(message.key.remoteJid, { text: `❌ Erreur inconnue: ${err.message}` }, { quoted: message });
        }
    }
};
