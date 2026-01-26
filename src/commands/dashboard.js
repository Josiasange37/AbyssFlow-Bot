const UserStats = require('../database/models/UserStats');
const sharp = require('sharp');
const { log } = require('../utils/logger');

module.exports = {
  name: 'dashboard',
  aliases: ['db', 'status', 'groupstatus'],
  description: 'Get a visual dashboard of the group activity',
  isGroupOnly: true,
  async execute({ chatId, bot, message }) {
    try {
      await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Génération du Tableau de Bord*\nExtraction et modélisation des données d'activité en cours...` }, { quoted: message });

      const metadata = await bot.sock.groupMetadata(chatId);
      const stats = await UserStats.find({ groupId: chatId }).sort({ level: -1, xp: -1 }).limit(5);
      const totalMembers = metadata.participants.length;
      const activeCount = await UserStats.countDocuments({ groupId: chatId, messagesCount: { $gt: 0 } });

      const groupName = metadata.subject;
      const topUser = stats[0] ? stats[0].userId.split('@')[0] : "N/A";

      const width = 800;
      const height = 500;

      const svgDashboard = `
      <svg width="${width}" height="${height}">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0f0c29;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#1a1a2e;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bgGrad)" rx="20" />
        
        <text x="40" y="60" font-family="Arial" font-size="35" fill="#f0f0f0" font-weight="bold">DIANE - EXECUTIVE DASHBOARD</text>
        <text x="40" y="100" font-family="Arial" font-size="20" fill="#888">${groupName.toUpperCase()}</text>
        
        <rect x="40" y="140" width="220" height="120" fill="rgba(255,255,255,0.03)" rx="15" stroke="rgba(255,255,255,0.1)" />
        <text x="60" y="180" font-family="Arial" font-size="18" fill="#aaa">MEMBRES</text>
        <text x="60" y="230" font-family="Arial" font-size="40" fill="#fff" font-weight="bold">${totalMembers}</text>
        
        <rect x="290" y="140" width="220" height="120" fill="rgba(255,255,255,0.03)" rx="15" stroke="rgba(255,255,255,0.1)" />
        <text x="310" y="180" font-family="Arial" font-size="18" fill="#aaa">ACTIFS</text>
        <text x="310" y="230" font-family="Arial" font-size="40" fill="#fff" font-weight="bold">${activeCount}</text>
        
        <rect x="540" y="140" width="220" height="120" fill="rgba(255,255,255,0.03)" rx="15" stroke="rgba(255,255,255,0.1)" />
        <text x="560" y="180" font-family="Arial" font-size="18" fill="#aaa">TOP GRADE</text>
        <text x="560" y="230" font-family="Arial" font-size="25" fill="#fff" font-weight="bold">@${topUser}</text>
        
        <text x="40" y="320" font-family="Arial" font-size="22" fill="#fff" font-weight="bold">ÉTAT DE L' UNITÉ</text>
        <rect x="40" y="340" width="720" height="40" fill="rgba(255,255,255,0.05)" rx="20" />
        <rect x="40" y="340" width="${Math.min(720, (activeCount / totalMembers) * 720)}" height="40" fill="#f0f0f0" rx="20" />
        <text x="40" y="410" font-family="Arial" font-size="16" fill="#888">Indice d'engagement opérationnel.</text>
      </svg>`;

      const dashboardBuffer = await sharp(Buffer.from(svgDashboard)).png().toBuffer();

      await bot.sendMessage(chatId, {
        image: dashboardBuffer,
        caption: `* \`${bot.botName || 'Diane'}\` *\n\n*TABLEAU DE BORD EXÉCUTIF [ ${groupName} ]*\n🛡️ Engagement : \`${Math.round((activeCount / totalMembers) * 100)}%\`\n🏅 Top : @${topUser}\n\nDonnées archivées pour audit technique.`,
        mentions: stats[0] ? [stats[0].userId] : []
      }, { quoted: message });

    } catch (error) {
      log.error('Dashboard command failed:', error.message);
      await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Erreur*\nÉchec critique de la modélisation du tableau de bord.` }, { quoted: message });
    }
  }
};
