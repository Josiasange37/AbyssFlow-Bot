#!/usr/bin/env node

const {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  downloadMediaMessage,
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs-extra');
const https = require('https');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

const FALLBACK_VERSION = [2, 3000, 38];
const RATE_WINDOW_MS = 60_000; // 1 minute in milliseconds
const GITHUB_CACHE_TTL_MS = 5 * 60_000; // 5 minutes in milliseconds

// ANSI Color Codes for WhatsApp formatting
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Message Themes
const THEMES = {
  info: { 
    border: COLORS.cyan,
    text: COLORS.white,
    accent: COLORS.cyan,
    icon: 'ℹ️'
  },
  success: {
    border: COLORS.green,
    text: COLORS.white,
    accent: COLORS.green,
    icon: '✅'
  },
  warning: {
    border: COLORS.yellow,
    text: COLORS.white,
    accent: COLORS.yellow,
    icon: '⚠️'
  },
  error: {
    border: COLORS.red,
    text: COLORS.white,
    accent: COLORS.red,
    icon: '❌'
  },
  special: {
    border: COLORS.magenta,
    text: COLORS.white,
    accent: COLORS.magenta,
    icon: '✨'
  }
}

const CONFIG = {
  owners: process.env.BOT_OWNERS
    ? process.env.BOT_OWNERS.split(',').map((v) => v.trim()).filter(Boolean)
    : [],
  prefix: process.env.BOT_PREFIX?.trim() || '*',
  sessionPath: process.env.SESSION_PATH || './session',
  maxCommandsPerMinute: Number(process.env.MAX_COMMANDS_PER_MINUTE) || 12,
  minDelay: Number(process.env.RESPONSE_DELAY_MIN_MS) || 250,
  maxDelay: Number(process.env.RESPONSE_DELAY_MAX_MS) || 900,
  reconnectBase: Number(process.env.RECONNECT_BASE_DELAY_MS) || 2000,
  reconnectMax: Number(process.env.RECONNECT_MAX_DELAY_MS) || 15000,
  logLevel: process.env.LOG_LEVEL || 'info',
  creator: {
    name: process.env.CREATOR_NAME || 'Unknown',
    bio: process.env.CREATOR_BIO || '',
    tagline: process.env.CREATOR_TAGLINE || 'Building the future, one line of code at a time',
    location: process.env.CREATOR_LOCATION || 'Remote | Global',
    skills: process.env.CREATOR_SKILLS || 'JavaScript, Node.js, React, Python',
    linkedin: process.env.CREATOR_LINKEDIN || '',
    github: process.env.CREATOR_GITHUB || '',
    portfolio: process.env.CREATOR_PORTFOLIO || '',
    x: process.env.CREATOR_X || '',
    tiktok: process.env.CREATOR_TIKTOK || '',
    twitter: process.env.CREATOR_TWITTER || process.env.CREATOR_X || '',
    instagram: process.env.CREATOR_INSTAGRAM || '',
    youtube: process.env.CREATOR_YOUTUBE || '',
    githubUsername: process.env.CREATOR_GITHUB_USERNAME || '',
    githubBio: process.env.CREATOR_GITHUB_BIO || '',
    CREATOR_STARTUP: process.env.CREATOR_STARTUP || 'Xyber Clan',
    CREATOR_STARTUP_URL: process.env.CREATOR_STARTUP_URL || '',
    STARTUP_DESCRIPTION: process.env.STARTUP_DESCRIPTION || 'Innovative tech solutions',
    CONTACT_EMAIL: process.env.CONTACT_EMAIL || '',
  },
};

const LOG_LEVEL_MAP = { error: 0, warn: 1, info: 2 };
const LOG_THRESHOLD = LOG_LEVEL_MAP[CONFIG.logLevel] ?? LOG_LEVEL_MAP.info;

const log = {
  info: (...args) => {
    if (LOG_THRESHOLD >= LOG_LEVEL_MAP.info) {
      console.log('[INFO]', ...args);
    }
  },
  warn: (...args) => {
    if (LOG_THRESHOLD >= LOG_LEVEL_MAP.warn) {
      console.warn('[WARN]', ...args);
    }
  },
  error: (...args) => console.error('[ERROR]', ...args),
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeNumber(input) {
  return (input || '').replace(/[^0-9]/g, '');
}

class AbyssFlow {
  constructor() {
    this.sock = null;
    this.commandHistory = new Map();
    this.reconnectDelay = CONFIG.reconnectBase;
    this.pendingReconnect = false;
    this.metrics = {
      startedAt: Date.now(),
      lastPingAt: 0,
    };
    this.commandCount = 0;
    this.githubCache = { data: null, fetchedAt: 0 };
    this.groupsDataPath = path.join(__dirname, 'data', 'groups.json');
    this.groupSettings = this.loadGroupSettings();
    
    // Message cache for tracking edits and deletions (max 1000 messages)
    this.messageCache = new Map();
    this.maxCacheSize = 1000;

    if (!CONFIG.owners.length) {
      log.warn('No owners configured. Set BOT_OWNERS in .env');
    } else {
      log.info(`Owners: ${CONFIG.owners.join(', ')}`);
    }
  }

  loadGroupSettings() {
    try {
      if (fs.existsSync(this.groupsDataPath)) {
        const data = fs.readFileSync(this.groupsDataPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      log.error('Failed to load group settings:', error.message);
    }
    return { groups: {} };
  }

  saveGroupSettings() {
    try {
      fs.ensureDirSync(path.dirname(this.groupsDataPath));
      fs.writeFileSync(this.groupsDataPath, JSON.stringify(this.groupSettings, null, 2));
    } catch (error) {
      log.error('Failed to save group settings:', error.message);
    }
  }

  getGroupSettings(groupId) {
    if (!this.groupSettings.groups[groupId]) {
      this.groupSettings.groups[groupId] = {
        welcome: {
          enabled: false,
          message: '🌊 Bienvenue @user dans le groupe!\n\n💧 Que la force du Water Hashira soit avec toi!'
        },
        goodbye: {
          enabled: false,
          message: '👋 @user a quitté le groupe.\n\n🌊 Que ton chemin soit paisible comme l\'eau calme.'
        },
        antibot: {
          enabled: false
        }
      };
      this.saveGroupSettings();
    }
    return this.groupSettings.groups[groupId];
  }

  async start() {
    try {
      await fs.ensureDir(path.resolve(CONFIG.sessionPath));
      const { state, saveCreds } = await useMultiFileAuthState(CONFIG.sessionPath);

      let version;
      try {
        ({ version } = await fetchLatestBaileysVersion());
      } catch (error) {
        log.warn(`Baileys version lookup failed: ${error.message}. Using fallback.`);
        version = FALLBACK_VERSION;
      }

      this.sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        browser: ['AbyssFlow', 'Chrome', '125.0.0'],
        markOnlineOnConnect: false,
        syncFullHistory: false,
        generateHighQualityLinkPreview: false,
        connectTimeoutMs: 45_000,
        defaultQueryTimeoutMs: 30_000,
      });

      this.sock.ev.on('creds.update', saveCreds);
      this.sock.ev.on('connection.update', (update) => this.onConnection(update));
      this.sock.ev.on('messages.upsert', (payload) => this.onMessages(payload));
      this.sock.ev.on('messages.update', (updates) => this.onMessageUpdate(updates));
      this.sock.ev.on('group-participants.update', (update) => this.onGroupParticipantsUpdate(update));

      this.pendingReconnect = false;
      log.info('Socket initialized.');
    } catch (error) {
      log.error('Startup error:', error.message);
      this.scheduleReconnect();
    }
  }

  onConnection(update = {}) {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      log.info('QR code generated. Scan with WhatsApp quickly.');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'connecting') {
      log.info('Establishing session...');
      return;
    }

    if (connection === 'open') {
      this.reconnectDelay = CONFIG.reconnectBase;
      log.info('Session established.');
      return;
    }

    if (connection === 'close') {
      const statusCode =
        lastDisconnect?.error?.output?.statusCode ??
        lastDisconnect?.error?.statusCode ??
        lastDisconnect?.error?.code ??
        lastDisconnect?.error?.cause?.statusCode ??
        0;

      log.warn(`Connection closed (code ${statusCode || 'unknown'})`);

      const shouldReconnect = statusCode !== DisconnectReason.loggedOut && statusCode !== 401;

      if (shouldReconnect) {
        this.scheduleReconnect();
      } else {
        log.warn('Session logged out. Delete the session directory and restart.');
      }
    }
  }

  scheduleReconnect() {
    if (this.pendingReconnect) {
      return;
    }

    this.pendingReconnect = true;
    const base = Math.min(this.reconnectDelay, CONFIG.reconnectMax);
    const jitter = Math.random() * 500;
    const delay = base + jitter;

    log.warn(`Reconnecting in ${Math.round(delay)}ms...`);

    setTimeout(() => {
      this.reconnectDelay = Math.min(base * 1.6, CONFIG.reconnectMax);
      this.pendingReconnect = false;
      this.start().catch((error) => log.error('Reconnect failure:', error.message));
    }, delay);
  }

  async onMessages(payload) {
    if (!payload || payload.type !== 'notify') {
      return;
    }

    for (const message of payload.messages || []) {
      try {
        // Cache the message for edit/delete tracking
        this.cacheMessage(message);
        
        await this.handleMessage(message);
      } catch (error) {
        log.error('Message handling error:', error.message);
      }
    }
  }

  async onGroupParticipantsUpdate(update) {
    try {
      const { id: groupId, participants, action } = update;
      
      if (!groupId || !participants || !participants.length) return;

      const settings = this.getGroupSettings(groupId);

      for (const participant of participants) {
        // Check for antibot when someone is added
        if (action === 'add') {
          // Check if antibot is enabled
          if (settings.antibot?.enabled) {
            await this.checkAndRemoveBot(groupId, participant);
          }
          
          // Send welcome message if enabled
          if (settings.welcome.enabled) {
            await this.sendWelcomeMessage(groupId, participant, settings.welcome.message);
          }
        } else if ((action === 'remove' || action === 'leave') && settings.goodbye.enabled) {
          await this.sendGoodbyeMessage(groupId, participant, settings.goodbye.message);
        }
      }
    } catch (error) {
      log.error('Group participants update error:', error.message);
    }
  }

  async checkAndRemoveBot(groupId, participantJid) {
    try {
      // Skip if it's our own bot
      const ourBotJid = this.sock.user.id.split(':')[0] + '@s.whatsapp.net';
      if (participantJid === ourBotJid) return;

      // Check if the participant is a bot (ends with @lid or is a business account with bot indicators)
      const isBot = participantJid.includes('@lid') || 
                    participantJid.includes('bot') ||
                    participantJid.includes('Bot');

      if (isBot) {
        log.info(`Bot detected: ${participantJid} in ${groupId}`);
        
        // Try to remove the bot
        try {
          await this.sock.groupParticipantsUpdate(groupId, [participantJid], 'remove');
          
          await this.sock.sendMessage(groupId, {
            text: [
              `🤖 *Bot Détecté et Expulsé!*`,
              '',
              `🚫 *Bot:* @${participantJid.split('@')[0]}`,
              '',
              `⚠️ Ce groupe a l'anti-bot activé.`,
              `Seul ${CONFIG.botName || 'AbyssFlow'} est autorisé.`,
              '',
              `🌊 _Protection par le Water Hashira_`
            ].join('\n'),
            mentions: [participantJid]
          });
          
          log.info(`Bot ${participantJid} removed from ${groupId}`);
        } catch (removeError) {
          log.error(`Failed to remove bot ${participantJid}:`, removeError.message);
          
          // Notify admins if bot couldn't be removed
          await this.sock.sendMessage(groupId, {
            text: [
              `⚠️ *Bot Détecté!*`,
              '',
              `🤖 *Bot:* @${participantJid.split('@')[0]}`,
              '',
              `❌ Impossible de l'expulser automatiquement.`,
              `Le bot doit être admin pour expulser.`,
              '',
              `💡 *Solution:* Promouvoir le bot en admin ou expulser manuellement.`,
              '',
              `🌊 _Water Hashira_`
            ].join('\n'),
            mentions: [participantJid]
          });
        }
      }
    } catch (error) {
      log.error('Error checking for bot:', error.message);
    }
  }

  async sendWelcomeMessage(groupId, participant, template) {
    try {
      const message = template.replace(/@user/g, `@${participant.split('@')[0]}`);
      
      await sleep(1000); // Petit délai pour paraître naturel
      
      await this.sock.sendMessage(groupId, {
        text: message,
        mentions: [participant]
      });
      
      log.info(`Welcome message sent to ${participant} in ${groupId}`);
    } catch (error) {
      log.error('Failed to send welcome message:', error.message);
    }
  }

  async sendGoodbyeMessage(groupId, participant, template) {
    try {
      const message = template.replace(/@user/g, `@${participant.split('@')[0]}`);
      
      await sleep(1000);
      
      await this.sock.sendMessage(groupId, {
        text: message,
        mentions: [participant]
      });
      
      log.info(`Goodbye message sent for ${participant} in ${groupId}`);
    } catch (error) {
      log.error('Failed to send goodbye message:', error.message);
    }
  }

  cacheMessage(message) {
    try {
      if (!message?.key?.id || !message?.message) return;
      
      const messageId = message.key.id;
      const chatId = message.key.remoteJid;
      
      // Store message data
      const cachedData = {
        id: messageId,
        chatId: chatId,
        sender: message.key.participant || message.key.remoteJid,
        timestamp: message.messageTimestamp || Date.now(),
        message: message.message,
        text: this.extractText(message),
        hasMedia: !!(message.message?.imageMessage || message.message?.videoMessage || 
                     message.message?.audioMessage || message.message?.documentMessage || 
                     message.message?.stickerMessage)
      };
      
      this.messageCache.set(messageId, cachedData);
      
      // Limit cache size
      if (this.messageCache.size > this.maxCacheSize) {
        const firstKey = this.messageCache.keys().next().value;
        this.messageCache.delete(firstKey);
      }
    } catch (error) {
      log.error('Failed to cache message:', error.message);
    }
  }

  async onMessageUpdate(updates) {
    try {
      for (const update of updates) {
        const messageId = update.key.id;
        const chatId = update.key.remoteJid;
        
        // Log update for debugging
        if (LOG_THRESHOLD >= LOG_LEVEL_MAP.debug) {
          log.debug('Message update received:', JSON.stringify({
            messageId,
            chatId,
            updateKeys: Object.keys(update.update || {}),
            status: update.update?.status,
            messageStubType: update.update?.messageStubType
          }));
        }
        
        // Check if message was deleted
        // In Baileys, deleted messages have update.update.message = null or status = DELETED
        if (update.update?.message === null || 
            update.update?.status === 'DELETED' ||
            update.update?.messageStubType === 68 ||
            (update.update && Object.keys(update.update).length === 0)) {
          
          const cachedMessage = this.messageCache.get(messageId);
          
          if (cachedMessage) {
            log.info(`Message deletion detected: ${messageId} in ${chatId}`);
            await this.notifyMessageDeletion(chatId, cachedMessage);
            // Keep in cache for a bit in case of multiple delete events
            setTimeout(() => this.messageCache.delete(messageId), 5000);
          } else {
            log.debug(`Deleted message not in cache: ${messageId}`);
          }
        }
        // Check if message was edited
        else if (update.update?.message) {
          const cachedMessage = this.messageCache.get(messageId);
          
          if (cachedMessage) {
            const oldText = cachedMessage.text || '[Message sans texte]';
            const newText = this.extractTextFromUpdate(update.update.message) || '[Message sans texte]';
            
            // Only notify if text actually changed
            if (oldText !== newText) {
              log.info(`Message edit detected: ${messageId} in ${chatId}`);
              await this.notifyMessageEdit(chatId, cachedMessage.sender, oldText, newText);
              
              // Update cache
              cachedMessage.text = newText;
              cachedMessage.message = update.update.message;
              this.messageCache.set(messageId, cachedMessage);
            }
          }
        }
      }
    } catch (error) {
      log.error('Message update handling error:', error.message);
    }
  }

  async notifyMessageEdit(chatId, sender, oldText, newText) {
    try {
      const senderName = `@${sender.split('@')[0]}`;
      
      await this.sock.sendMessage(chatId, {
        text: [
          `✏️ *Message Modifié*`,
          '',
          `👤 *Utilisateur:* ${senderName}`,
          '',
          `📝 *Ancien message:*`,
          `"${oldText}"`,
          '',
          `📝 *Nouveau message:*`,
          `"${newText}"`,
          '',
          `🌊 _Détecté par le Water Hashira_`
        ].join('\n'),
        mentions: [sender]
      });
      
      log.info(`Message edit detected in ${chatId} by ${sender}`);
    } catch (error) {
      log.error('Failed to notify message edit:', error.message);
    }
  }

  async notifyMessageDeletion(chatId, cachedMessage) {
    try {
      const senderName = `@${cachedMessage.sender.split('@')[0]}`;
      
      // If message had media, try to resend it
      if (cachedMessage.hasMedia && cachedMessage.message) {
        await this.resendDeletedMedia(chatId, cachedMessage, senderName);
      } else if (cachedMessage.text) {
        // Text message
        await this.sock.sendMessage(chatId, {
          text: [
            `🗑️ *Message Supprimé*`,
            '',
            `👤 *Utilisateur:* ${senderName}`,
            '',
            `📝 *Message supprimé:*`,
            `"${cachedMessage.text}"`,
            '',
            `🌊 _Détecté par le Water Hashira_`
          ].join('\n'),
          mentions: [cachedMessage.sender]
        });
      }
      
      log.info(`Message deletion detected in ${chatId} by ${cachedMessage.sender}`);
    } catch (error) {
      log.error('Failed to notify message deletion:', error.message);
    }
  }

  async resendDeletedMedia(chatId, cachedMessage, senderName) {
    try {
      const msg = cachedMessage.message;
      let mediaType = 'Media';
      
      log.info(`Attempting to resend deleted media in ${chatId}`);
      
      // Try to forward the original message if possible
      if (msg.imageMessage) {
        mediaType = 'Image';
        await this.sock.sendMessage(chatId, {
          image: msg.imageMessage.url ? { url: msg.imageMessage.url } : msg.imageMessage,
          caption: `🗑️ *Image Supprimée*\n\n👤 *Par:* ${senderName}\n\n🌊 _Récupérée par le Water Hashira_`,
          mentions: [cachedMessage.sender]
        });
      } else if (msg.videoMessage) {
        mediaType = 'Vidéo';
        await this.sock.sendMessage(chatId, {
          video: msg.videoMessage.url ? { url: msg.videoMessage.url } : msg.videoMessage,
          caption: `🗑️ *Vidéo Supprimée*\n\n👤 *Par:* ${senderName}\n\n🌊 _Récupérée par le Water Hashira_`,
          mentions: [cachedMessage.sender]
        });
      } else if (msg.stickerMessage) {
        mediaType = 'Sticker';
        await this.sock.sendMessage(chatId, {
          sticker: msg.stickerMessage.url ? { url: msg.stickerMessage.url } : msg.stickerMessage
        });
        await this.sock.sendMessage(chatId, {
          text: `🗑️ *Sticker Supprimé*\n\n👤 *Par:* ${senderName}\n\n🌊 _Récupéré par le Water Hashira_`,
          mentions: [cachedMessage.sender]
        });
      } else if (msg.audioMessage) {
        mediaType = 'Audio';
        await this.sock.sendMessage(chatId, {
          audio: msg.audioMessage.url ? { url: msg.audioMessage.url } : msg.audioMessage,
          mimetype: msg.audioMessage.mimetype,
          mentions: [cachedMessage.sender]
        });
      } else if (msg.documentMessage) {
        mediaType = 'Document';
        await this.sock.sendMessage(chatId, {
          document: msg.documentMessage.url ? { url: msg.documentMessage.url } : msg.documentMessage,
          mimetype: msg.documentMessage.mimetype,
          fileName: msg.documentMessage.fileName || 'document',
          mentions: [cachedMessage.sender]
        });
      }
      
      log.info(`Successfully resent deleted ${mediaType} in ${chatId}`);
    } catch (error) {
      log.error('Failed to resend deleted media:', error.message, error.stack);
      // Fallback to text notification
      try {
        await this.sock.sendMessage(chatId, {
          text: `🗑️ *Media Supprimé*\n\n👤 *Par:* ${senderName}\n\n⚠️ Le média ne peut plus être récupéré (supprimé du serveur WhatsApp)\n\n🌊 _Water Hashira_`,
          mentions: [cachedMessage.sender]
        });
      } catch (fallbackError) {
        log.error('Failed to send fallback notification:', fallbackError.message);
      }
    }
  }

  async downloadMedia(mediaMessage) {
    try {
      // Create a proper message structure for downloadMediaMessage
      const messageType = Object.keys(mediaMessage)[0];
      const fakeMessage = {
        key: { id: 'fake-id' },
        message: {
          [messageType]: mediaMessage
        }
      };
      
      const buffer = await downloadMediaMessage(
        fakeMessage,
        'buffer',
        {},
        { logger: log, reuploadRequest: this.sock.updateMediaMessage }
      );
      return buffer;
    } catch (error) {
      log.error('Failed to download media:', error.message);
      throw error;
    }
  }

  extractTextFromUpdate(message) {
    return message?.conversation ||
           message?.extendedTextMessage?.text ||
           message?.imageMessage?.caption ||
           message?.videoMessage?.caption ||
           '';
  }

  async handleMessage(message) {
    if (!message?.message) return;
    if (message.key.fromMe) return;

    const chatId = message.key.remoteJid;
    if (!chatId || chatId === 'status@broadcast') return;

    const text = this.extractText(message);
    if (!text || !text.startsWith(CONFIG.prefix)) return;

    const commandLine = text.slice(CONFIG.prefix.length).trim();
    if (!commandLine) return;

    const sender = message.key.participant || message.key.remoteJid;
    const isOwner = this.isOwner(sender);
    const isGroup = chatId.endsWith('@g.us');
    const isGroupAdmin = isGroup ? await this.isGroupAdmin(chatId, sender) : false;
    const canUseAdminCommands = isOwner || isGroupAdmin;

    // Debug logging for admin commands
    if (LOG_THRESHOLD >= LOG_LEVEL_MAP.info) {
      log.info(`Command: ${commandLine.split(/\s+/)[0]} | Sender: ${sender} | Owner: ${isOwner} | Group: ${isGroup} | GroupAdmin: ${isGroupAdmin} | CanUseAdmin: ${canUseAdminCommands}`);
    }

    if (!this.withinRateLimit(sender)) {
      log.warn(`Rate limit reached for ${sender}`);
      return;
    }

    await this.sock.readMessages([message.key]).catch(() => {});

    const [command, ...args] = commandLine.split(/\s+/);
    const cmd = command.toLowerCase();
    this.commandCount += 1;

    switch (cmd) {
      case 'ping':
        await this.cmdPing(chatId, message, isOwner);
        break;
      case 'help':
      case 'menu':
      case 'commands':
        await this.cmdHelp(chatId, message, isOwner);
        break;
      case 'about':
        await this.cmdAbout(chatId, message);
        break;
      case 'links':
        await this.cmdLinks(chatId, message);
        break;
      case 'git':
        await this.cmdGit(chatId, message);
        break;
      
      case 'github':
        await this.cmdGithub(chatId, message, args);
        break;
      
      // Debug command to identify your number
      case 'whoami':
        const whoamiMsg = [
          `*🔍 Informations de Votre Compte*`,
          '',
          `📱 *Votre JID:*`,
          `\`${sender}\``,
          '',
          `🔢 *Numéro Normalisé:*`,
          `\`${normalizeNumber(sender)}\``,
          '',
          `🔐 *Permissions:*`,
          `• Propriétaire: ${isOwner ? '✅' : '❌'}`,
          `• Admin du groupe: ${isGroup && isGroupAdmin ? '✅' : (isGroup ? '❌' : 'N/A')}`,
          `• Peut utiliser commandes admin: ${canUseAdminCommands ? '✅' : '❌'}`,
          '',
          `💡 *Utilisez cette info pour le debug*`
        ].join('\n');
        
        await this.sendSafeMessage(chatId, whoamiMsg, {
          isCommandResponse: true,
          title: 'WHO AM I',
          type: 'info',
          quotedMessage: message
        });
        break;
      
      // Legal & Privacy commands
      case 'privacy':
      case 'privacypolicy':
        await this.cmdPrivacy(chatId, message);
        break;
      
      case 'disclaimer':
      case 'legal':
        await this.cmdDisclaimer(chatId, message);
        break;
      
      case 'terms':
      case 'tos':
        await this.cmdTerms(chatId, message);
        break;
      
      // Owner commands
      case 'broadcast':
        if (!isOwner) {
          await this.sendSafeMessage(chatId, '❌ Cette commande est réservée aux propriétaires du bot!');
        } else {
          await this.cmdBroadcast(chatId, message, args);
        }
        break;
      
      case 'stats':
      case 'statistics':
        if (!isOwner) {
          await this.sendSafeMessage(chatId, '❌ Cette commande est réservée aux propriétaires du bot!');
        } else {
          await this.cmdStats(chatId, message);
        }
        break;
      
      case 'block':
        if (!isOwner) {
          await this.sendSafeMessage(chatId, '❌ Cette commande est réservée aux propriétaires du bot!');
        } else {
          await this.cmdBlock(chatId, message, args);
        }
        break;
      
      case 'unblock':
        if (!isOwner) {
          await this.sendSafeMessage(chatId, '❌ Cette commande est réservée aux propriétaires du bot!');
        } else {
          await this.cmdUnblock(chatId, message, args);
        }
        break;
      
      case 'join':
        if (!isOwner) {
          await this.sendSafeMessage(chatId, '❌ Cette commande est réservée aux propriétaires du bot!');
        } else {
          await this.cmdJoin(chatId, message, args);
        }
        break;
      
      case 'leave':
      case 'exit':
        if (!isOwner) {
          await this.sendSafeMessage(chatId, '❌ Cette commande est réservée aux propriétaires du bot!');
        } else if (!isGroup) {
          await this.sendSafeMessage(chatId, '❌ Cette commande fonctionne uniquement dans les groupes!');
        } else {
          await this.cmdLeave(chatId, message);
        }
        break;
      
      // Admin commands
      case 'welcome':
        if (!isGroup) {
          await this.sendSafeMessage(chatId, '❌ Cette commande fonctionne uniquement dans les groupes!', { quotedMessage: message });
        } else if (!canUseAdminCommands) {
          await this.sendSafeMessage(chatId, '❌ Seuls le créateur et les admins peuvent utiliser cette commande!', { quotedMessage: message });
        } else {
          await this.cmdWelcome(chatId, args);
        }
        break;
      
      case 'goodbye':
        if (!isGroup) {
          await this.sendSafeMessage(chatId, '❌ Cette commande fonctionne uniquement dans les groupes!', { quotedMessage: message });
        } else if (!canUseAdminCommands) {
          await this.sendSafeMessage(chatId, '❌ Seuls le créateur et les admins peuvent utiliser cette commande!', { quotedMessage: message });
        } else {
          await this.cmdGoodbye(chatId, args);
        }
        break;
      
      case 'kick':
      case 'remove':
        if (!isGroup) {
          await this.sendSafeMessage(chatId, '❌ Cette commande fonctionne uniquement dans les groupes!', { quotedMessage: message });
        } else if (!canUseAdminCommands) {
          await this.sendSafeMessage(chatId, '❌ Seuls le créateur et les admins peuvent utiliser cette commande!', { quotedMessage: message });
        } else {
          await this.cmdKick(chatId, message, args, canUseAdminCommands);
        }
        break;
      
      case 'promote':
        if (!isGroup) {
          await this.sendSafeMessage(chatId, '❌ Cette commande fonctionne uniquement dans les groupes!', { quotedMessage: message });
        } else if (!canUseAdminCommands) {
          await this.sendSafeMessage(chatId, '❌ Seuls le créateur et les admins peuvent utiliser cette commande!', { quotedMessage: message });
        } else {
          await this.cmdPromote(chatId, message, args);
        }
        break;
      
      case 'demote':
        if (!isGroup) {
          await this.sendSafeMessage(chatId, '❌ Cette commande fonctionne uniquement dans les groupes!', { quotedMessage: message });
        } else if (!canUseAdminCommands) {
          await this.sendSafeMessage(chatId, '❌ Seuls le créateur et les admins peuvent utiliser cette commande!', { quotedMessage: message });
        } else {
          await this.cmdDemote(chatId, message, args);
        }
        break;
      
      case 'open':
      case 'unlock':
        if (!isGroup) {
          await this.sendSafeMessage(chatId, '❌ Cette commande fonctionne uniquement dans les groupes!', { quotedMessage: message });
        } else if (!canUseAdminCommands) {
          await this.sendSafeMessage(chatId, '❌ Seuls le créateur et les admins peuvent utiliser cette commande!', { quotedMessage: message });
        } else {
          await this.cmdOpenGroup(chatId, message);
        }
        break;
      
      case 'close':
      case 'lock':
        if (!isGroup) {
          await this.sendSafeMessage(chatId, '❌ Cette commande fonctionne uniquement dans les groupes!', { quotedMessage: message });
        } else if (!canUseAdminCommands) {
          await this.sendSafeMessage(chatId, '❌ Seuls le créateur et les admins peuvent utiliser cette commande!', { quotedMessage: message });
        } else {
          await this.cmdCloseGroup(chatId, message);
        }
        break;
      
      case 'botstatus':
      case 'botinfo':
        if (!isGroup) {
          await this.sendSafeMessage(chatId, '❌ Cette commande fonctionne uniquement dans les groupes!', { quotedMessage: message });
        } else {
          await this.cmdBotStatus(chatId);
        }
        break;
      
      case 'add':
      case 'invite':
        if (!isGroup) {
          await this.sendSafeMessage(chatId, '❌ Cette commande fonctionne uniquement dans les groupes!', { quotedMessage: message });
        } else if (!canUseAdminCommands) {
          await this.sendSafeMessage(chatId, '❌ Seuls le créateur et les admins peuvent utiliser cette commande!', { quotedMessage: message });
        } else {
          await this.cmdAdd(chatId, message, args, canUseAdminCommands);
        }
        break;
      
      case 'tagall':
      case 'mentionall':
      case 'everyone':
        if (!isGroup) {
          await this.sendSafeMessage(chatId, '❌ Cette commande fonctionne uniquement dans les groupes!', { quotedMessage: message });
        } else if (!canUseAdminCommands) {
          await this.sendSafeMessage(chatId, '❌ Seuls le créateur et les admins peuvent utiliser cette commande!', { quotedMessage: message });
        } else {
          await this.cmdTagAll(chatId, message, args);
        }
        break;
      
      case 'groupinfo':
      case 'infogroup':
      case 'groupdetails':
        if (!isGroup) {
          await this.sendSafeMessage(chatId, '❌ Cette commande fonctionne uniquement dans les groupes!', { quotedMessage: message });
        } else {
          await this.cmdGroupInfo(chatId, message);
        }
        break;
      
      case 'viewonce':
      case 'antiviewonce':
      case 'revealvo':
        await this.cmdViewOnce(chatId, message);
        break;
      
      case 'sticker':
      case 'stiker':
      case 's':
        await this.cmdToSticker(chatId, message);
        break;
      
      case 'toimage':
      case 'toimg':
      case 'topng':
        await this.cmdToImage(chatId, message);
        break;
      
      case 'antibot':
      case 'antibots':
      case 'nobot':
        if (!isGroup) {
          await this.sendSafeMessage(chatId, '❌ Cette commande fonctionne uniquement dans les groupes!', { quotedMessage: message });
        } else if (!canUseAdminCommands) {
          await this.sendSafeMessage(chatId, '❌ Seuls le créateur et les admins peuvent utiliser cette commande!', { quotedMessage: message });
        } else {
          await this.cmdAntiBot(chatId, message, args);
        }
        break;
      
      default:
        if (isOwner) {
          await this.sendSafeMessage(chatId, `unknown command: ${cmd}\n\nType *help for available commands`, { quotedMessage: message });
        }
        break;
    }
  }

  async cmdPing(chatId, message, isOwner) {
    const now = Date.now();
    const messageTs = Number(message.messageTimestamp || 0) * 1000;
    const latency = Math.max(0, messageTs ? now - messageTs : 0);
    const uptime = now - this.metrics.startedAt;

    this.metrics.lastPingAt = now;

    const response = `pong ${latency}ms | up ${this.formatDuration(uptime)} | ${isOwner ? 'admin' : 'user'}`;
    await this.sendSafeMessage(chatId, response, { quotedMessage: message });
  }

  async cmdHelp(jid, message, isOwner) {
    const prefix = CONFIG.prefix;
    
    // Public commands
    const publicCommands = [
      `*💧 Water Breathing Commands*`,
      '',
      `*${prefix}help* - Affiche ce menu`,
      `_Aliases: menu, commands_`,
      '',
      `*${prefix}ping* - Vérifie la latence`,
      `_Teste la vitesse de réponse_`,
      '',
      `*${prefix}about* - Profil du créateur`,
      `_Infos sur le Water Hashira_`,
      '',
      `*${prefix}links* - Liens sociaux`,
      `_Tous mes réseaux sociaux_`,
      '',
      `*${prefix}git* - Profil GitHub`,
      `_Stats et projets GitHub_`,
      '',
      `*${prefix}github <username>* - Profil GitHub`,
      `_Recherche n'importe quel utilisateur GitHub_`,
      `  • \`${prefix}github torvalds\``,
      '',
      `*${prefix}whoami* - Identifie votre numéro`,
      `_Debug: Affiche votre JID et statut_`
    ];

    // Group admin commands
    const groupCommands = [
      '',
      `*🛡️ Group Admin Commands*`,
      `_Créateur + Admins du groupe_`,
      '',
      `*${prefix}welcome* - Config bienvenue`,
      `  • \`${prefix}welcome on/off\` - Activer/Désactiver`,
      `  • \`${prefix}welcome set <msg>\` - Définir message`,
      '',
      `*${prefix}goodbye* - Config au revoir`,
      `  • \`${prefix}goodbye on/off\` - Activer/Désactiver`,
      `  • \`${prefix}goodbye set <msg>\` - Définir message`,
      '',
      `*${prefix}kick* - Expulser des membres`,
      `  • \`${prefix}kick @user\` - Expulser un membre`,
      `  • \`${prefix}remove @user1 @user2\` - Plusieurs membres`,
      `  ⚠️ Seuls admins et owners`,
      '',
      `*${prefix}add* - Ajouter des membres`,
      `  • \`${prefix}add 237XXXXXXXXX\` - Cameroun`,
      `  • \`${prefix}add 33XXXXXXXXX\` - France`,
      `  • \`${prefix}invite 237XXX 33YYY\` - Multi-pays`,
      `  ⚠️ Tous pays supportés`,
      '',
      `*${prefix}promote* - Promouvoir en admin`,
      `  • \`${prefix}promote @user\` - Promouvoir un membre`,
      `  • \`${prefix}promote @user1 @user2\` - Plusieurs membres`,
      `  ⚠️ Seuls admins et owners`,
      '',
      `*${prefix}demote* - Révoquer un admin`,
      `  • \`${prefix}demote @admin\` - Révoquer un admin`,
      `  • \`${prefix}demote @admin1 @admin2\` - Plusieurs admins`,
      `  ⚠️ Peut révoquer même le créateur!`,
      '',
      `*${prefix}open* - Ouvrir le groupe`,
      `  • \`${prefix}open\` - Tous les membres peuvent écrire`,
      `  • \`${prefix}unlock\` - Alias`,
      `  ⚠️ Seuls admins et owners`,
      '',
      `*${prefix}close* - Fermer le groupe`,
      `  • \`${prefix}close\` - Seuls les admins peuvent écrire`,
      `  • \`${prefix}lock\` - Alias`,
      `  ⚠️ Seuls admins et owners`,
      '',
      `*${prefix}tagall* - Mentionner tous les membres`,
      `  • \`${prefix}tagall\` - Annonce par défaut`,
      `  • \`${prefix}tagall Réunion à 15h!\` - Message personnalisé`,
      `  • \`${prefix}everyone\` - Alias`,
      '',
      `*${prefix}groupinfo* - Infos du groupe`,
      `  • Photo, description, admins`,
      `  • Rappel de contacter les admins`,
      `  • \`${prefix}infogroup\` - Alias`,
      '',
      `*${prefix}viewonce* - Extraire vue unique 👁️`,
      `  • Répondez à une vue unique avec cette commande`,
      `  • Renvoie l'image/vidéo en vue normale`,
      `  • \`${prefix}antiviewonce\` - Alias`,
      `  • \`${prefix}revealvo\` - Alias`,
      `  ⚠️ Tous les utilisateurs`,
      '',
      `*${prefix}sticker* - Image/Vidéo → Sticker 🎨`,
      `  • Envoyez une image avec \`${prefix}sticker\``,
      `  • Ou répondez à une image/vidéo`,
      `  • \`${prefix}s\` - Alias court`,
      `  ⚠️ Tous les utilisateurs`,
      '',
      `*${prefix}toimage* - Sticker → Image 🖼️`,
      `  • Envoyez un sticker avec \`${prefix}toimage\``,
      `  • Ou répondez à un sticker`,
      `  • \`${prefix}toimg\` - Alias`,
      `  ⚠️ Tous les utilisateurs`,
      '',
      `*${prefix}antibot* - Protection Anti-Bot 🤖`,
      `  • \`${prefix}antibot on\` - Activer`,
      `  • \`${prefix}antibot off\` - Désactiver`,
      `  • Expulse automatiquement les autres bots`,
      `  ⚠️ Seuls admins et owners`
    ];

    // Owner-only commands
    const ownerCommands = [
      '',
      `*⚡ Owner Commands*`,
      '',
      `*${prefix}broadcast* - Diffuser un message`,
      `  • \`${prefix}broadcast <message>\` - À tous les groupes`,
      '',
      `*${prefix}stats* - Statistiques détaillées`,
      `  • Groupes, messages, cache, uptime`,
      '',
      `*${prefix}block* - Bloquer un utilisateur`,
      `  • \`${prefix}block @user\` - Bloquer`,
      '',
      `*${prefix}unblock* - Débloquer un utilisateur`,
      `  • \`${prefix}unblock @user\` - Débloquer`,
      '',
      `*${prefix}join* - Rejoindre un groupe`,
      `  • \`${prefix}join <lien>\` - Via lien d'invitation`,
      '',
      `*${prefix}leave* - Quitter un groupe`,
      `  • \`${prefix}leave\` - Quitter le groupe actuel`
    ];
    
    // Legal & Privacy commands
    const legalCommands = [
      '',
      `*📜 Légal & Confidentialité*`,
      '',
      `*${prefix}privacy* - Politique de confidentialité`,
      `*${prefix}disclaimer* - Avertissement légal`,
      `*${prefix}terms* - Conditions d'utilisation`
    ];

    const helpText = isOwner 
      ? [...publicCommands, ...groupCommands, ...ownerCommands, ...legalCommands].join('\n')
      : [...publicCommands, ...groupCommands, ...legalCommands].join('\n');

    const footer = [
      '',
      `━━━━━━━━━━━━━━━━━━━━`,
      `🌊 *AbyssFlow Bot*`,
      `_Powered by Water Breathing_`,
      '',
      `📊 Total Commands: ${this.commandCount}`,
      `⏱️ Uptime: ${this.formatDuration(Date.now() - this.metrics.startedAt)}`,
      `👤 Status: ${isOwner ? 'Admin' : 'User'}`,
      '',
      `💡 Tip: Tapez ${prefix}about pour en savoir plus!`
    ].join('\n');

    const fullHelp = helpText + '\n' + footer;

    // Check if banner exists
    const bannerPaths = [
      path.join(__dirname, 'assets', 'banners', 'help-banner.jpg'),
      path.join(__dirname, 'assets', 'banners', 'help-banner.png'),
      path.join(__dirname, 'assets', 'banners', 'help-banner.jpeg')
    ];

    let bannerPath = null;
    for (const p of bannerPaths) {
      if (await fs.pathExists(p)) {
        bannerPath = p;
        break;
      }
    }

    // Send with banner if available
    if (bannerPath) {
      try {
        await this.sock.sendMessage(jid, {
          image: { url: bannerPath },
          caption: fullHelp,
          quoted: message,
          contextInfo: {
            isForwarded: false,
            forwardingScore: 0
          }
        });
        log.info('Help banner sent successfully');
      } catch (error) {
        log.error('Failed to send help banner:', error.message);
        // Fallback to text-only message
        await this.sendSafeMessage(jid, fullHelp, { 
          isCommandResponse: true, 
          title: 'HELP MENU',
          type: 'info',
          quotedMessage: message
        });
      }
    } else {
      // No banner, send text only
      await this.sendSafeMessage(jid, fullHelp, { 
        isCommandResponse: true, 
        title: 'HELP MENU',
        type: 'info',
        quotedMessage: message
      });
    }
  }

  async cmdAbout(jid, message) {
    const { name, bio, tagline, location, skills, CREATOR_STARTUP, CREATOR_STARTUP_URL, STARTUP_DESCRIPTION } = CONFIG.creator;
    const uptime = this.formatDuration(Date.now() - this.metrics.startedAt);
    
    const aboutText = [
      `*${name}*`,
      `_${tagline}_`,
      '',
      `🌊 *Water Hashira Status:* Active`,
      `⏱️ *Uptime:* ${uptime}`,
      `🌍 *Location:* ${location}`,
      '',
      `🚀 *Startup:* ${CREATOR_STARTUP}`,
      `   ${CREATOR_STARTUP_URL || 'Coming soon'}`,
      `   _${STARTUP_DESCRIPTION}_`,
      '',
      `📝 *Bio:*`,
      `${bio || 'No bio provided'}`,
      '',
      `💧 *Water Breathing Techniques:*`,
      `• Secure Messaging`,
      `• AI Integration`,
      `• Media Processing`,
      `• Real-time Automation`,
      '',
      `🛠️ *Skills:*`,
      `${skills}`
    ].join('\n');

    // Check if banner exists
    const bannerPaths = [
      path.join(__dirname, 'assets', 'banners', 'about-banner.jpg'),
      path.join(__dirname, 'assets', 'banners', 'about-banner.png'),
      path.join(__dirname, 'assets', 'banners', 'about-banner.jpeg')
    ];

    let bannerPath = null;
    for (const p of bannerPaths) {
      if (await fs.pathExists(p)) {
        bannerPath = p;
        break;
      }
    }

    // Send with banner if available
    if (bannerPath) {
      try {
        await this.sock.sendMessage(jid, {
          image: { url: bannerPath },
          caption: aboutText,
          quoted: message,
          contextInfo: {
            isForwarded: false,
            forwardingScore: 0
          }
        });
        log.info('About banner sent successfully');
      } catch (error) {
        log.error('Failed to send about banner:', error.message);
        // Fallback to text-only message
        await this.sendSafeMessage(jid, aboutText, { 
          isCommandResponse: true, 
          title: 'ABOUT ABYSSFLOW',
          type: 'special',
          quotedMessage: message
        });
      }
    } else {
      // No banner, send text only
      await this.sendSafeMessage(jid, aboutText, { 
        isCommandResponse: true, 
        title: 'ABOUT ABYSSFLOW',
        type: 'special',
        quotedMessage: message
      });
    }
  }

  async cmdLinks(jid, message) {
    const { linkedin, github, portfolio, x, twitter, tiktok, instagram, youtube, CREATOR_STARTUP_URL, CONTACT_EMAIL } = CONFIG.creator;
    
    const links = [
      `*🔗 Professional Links*`,
      '',
      linkedin ? `💼 *LinkedIn*\n   ${linkedin}` : null,
      github ? `💻 *GitHub*\n   ${github}` : null,
      portfolio ? `🌐 *Portfolio*\n   ${portfolio}` : null,
      '',
      `*📱 Social Media*`,
      '',
      (x || twitter) ? `🐦 *X/Twitter*\n   ${x || twitter}` : null,
      tiktok ? `🎵 *TikTok*\n   ${tiktok}` : null,
      instagram ? `📸 *Instagram*\n   ${instagram}` : null,
      youtube ? `▶️ *YouTube*\n   ${youtube}` : null,
      '',
      `*🚀 Projects*`,
      '',
      CREATOR_STARTUP_URL ? `🏢 *Startup*\n   ${CREATOR_STARTUP_URL}` : null,
      '',
      `*📧 Contact*`,
      '',
      CONTACT_EMAIL ? `✉️ *Email*\n   ${CONTACT_EMAIL}` : null
    ].filter(Boolean);

    const linksText = links.join('\n') || 'No links available';

    // Check if banner exists
    const bannerPaths = [
      path.join(__dirname, 'assets', 'banners', 'links-banner.jpg'),
      path.join(__dirname, 'assets', 'banners', 'links-banner.png'),
      path.join(__dirname, 'assets', 'banners', 'links-banner.jpeg')
    ];

    let bannerPath = null;
    for (const p of bannerPaths) {
      if (await fs.pathExists(p)) {
        bannerPath = p;
        break;
      }
    }

    // Send with banner if available
    if (bannerPath) {
      try {
        await this.sock.sendMessage(jid, {
          image: { url: bannerPath },
          caption: linksText,
          quoted: message,
          contextInfo: {
            isForwarded: false,
            forwardingScore: 0
          }
        });
        log.info('Links banner sent successfully');
      } catch (error) {
        log.error('Failed to send links banner:', error.message);
        // Fallback to text-only message
        await this.sendSafeMessage(jid, linksText, { 
          isCommandResponse: true, 
          title: 'CONNECT WITH ME',
          type: 'info',
          quotedMessage: message
        });
      }
    } else {
      // No banner, send text only
      await this.sendSafeMessage(jid, linksText, { 
        isCommandResponse: true, 
        title: 'CONNECT WITH ME',
        type: 'info',
        quotedMessage: message
      });
    }
  }

  async cmdGit(jid, message) {
    const profile = await this.fetchGithubProfile();
    const { githubUsername, githubBio } = CONFIG.creator;

    if (!profile) {
      await this.sendSafeMessage(jid, 
        `🚫 *Unable to fetch GitHub profile*\n\nPlease try again later or visit:\nhttps://github.com/${githubUsername}`,
        { isCommandResponse: true, title: 'GITHUB ERROR', type: 'error', quotedMessage: message }
      );
      return;
    }

    const gitText = [
      `👤 *${profile.name || githubUsername}*`,
      `_@${profile.login}_`,
      '',
      `📝 *Bio:*`,
      `${profile.bio || githubBio || 'No bio provided'}`,
      '',
      `🔗 *Profile:*`,
      `${profile.html_url || `https://github.com/${githubUsername}`}`,
      '',
      `📊 *Statistics:*`,
      `• 📦 Repositories: *${profile.public_repos || 0}*`,
      `• 👥 Followers: *${profile.followers || 0}*`,
      `• 🤝 Following: *${profile.following || 0}*`,
      profile.public_gists ? `• 📄 Gists: *${profile.public_gists}*` : null,
      '',
      profile.company ? `🏢 *Company:* ${profile.company}` : null,
      profile.location ? `📍 *Location:* ${profile.location}` : null,
      profile.blog ? `🌍 *Website:* ${profile.blog}` : null,
      profile.twitter_username ? `🐦 *Twitter:* @${profile.twitter_username}` : null,
      '',
      profile.created_at ? `📅 *Joined:* ${new Date(profile.created_at).toLocaleDateString()}` : null
    ].filter(Boolean).join('\n');

    // Send profile picture as image with caption
    if (profile.avatar_url) {
      try {
        await this.sock.sendMessage(jid, {
          image: { url: profile.avatar_url },
          caption: gitText,
          quoted: message,
          contextInfo: {
            isForwarded: false,
            forwardingScore: 0
          }
        });
      } catch (error) {
        log.error('Failed to send GitHub profile image:', error.message);
        // Fallback to text-only message
        await this.sendSafeMessage(jid, gitText, { 
          isCommandResponse: true, 
          title: 'GITHUB PROFILE',
          type: 'special',
          quotedMessage: message
        });
      }
    } else {
      // No avatar, send text only
      await this.sendSafeMessage(jid, gitText, { 
        isCommandResponse: true, 
        title: 'GITHUB PROFILE',
        type: 'special',
        quotedMessage: message
      });
    }
  }

  async cmdGithub(jid, message, args) {
    // Check if username is provided
    if (args.length === 0) {
      await this.sendSafeMessage(jid, [
        `❌ *Nom d'utilisateur GitHub manquant!*`,
        '',
        `*💡 Utilisation:*`,
        `\`${CONFIG.prefix}github <username>\``,
        '',
        `*Exemples:*`,
        `• \`${CONFIG.prefix}github Josiasange37\``,
        `• \`${CONFIG.prefix}github torvalds\``,
        `• \`${CONFIG.prefix}github github\``,
        '',
        `⚠️ *Note:* Utilisez le nom d'utilisateur GitHub exact`
      ].join('\n'), {
        quotedMessage: message
      });
      return;
    }

    const username = args[0];
    
    // Fetch the GitHub profile
    const profile = await this.fetchGithubProfileByUsername(username);

    if (!profile) {
      await this.sendSafeMessage(jid, [
        `🚫 *Utilisateur GitHub introuvable!*`,
        '',
        `❌ L'utilisateur \`${username}\` n'existe pas sur GitHub.`,
        '',
        `💡 *Vérifiez:*`,
        `• L'orthographe du nom d'utilisateur`,
        `• Que le compte existe bien`,
        `• https://github.com/${username}`,
        '',
        `🌊 _Recherche effectuée par le Water Hashira_`
      ].join('\n'), { 
        isCommandResponse: true, 
        title: 'GITHUB ERROR', 
        type: 'error',
        quotedMessage: message
      });
      return;
    }

    const gitText = [
      `👤 *${profile.name || username}*`,
      `_@${profile.login}_`,
      '',
      `📝 *Bio:*`,
      `${profile.bio || 'Aucune bio fournie'}`,
      '',
      `🔗 *Profil:*`,
      `${profile.html_url || `https://github.com/${username}`}`,
      '',
      `📊 *Statistiques:*`,
      `• 📦 Repositories: *${profile.public_repos || 0}*`,
      `• 👥 Followers: *${profile.followers || 0}*`,
      `• 🤝 Following: *${profile.following || 0}*`,
      profile.public_gists ? `• 📄 Gists: *${profile.public_gists}*` : null,
      '',
      profile.company ? `🏢 *Entreprise:* ${profile.company}` : null,
      profile.location ? `📍 *Localisation:* ${profile.location}` : null,
      profile.blog ? `🌍 *Site Web:* ${profile.blog}` : null,
      profile.twitter_username ? `🐦 *Twitter:* @${profile.twitter_username}` : null,
      profile.email ? `📧 *Email:* ${profile.email}` : null,
      '',
      profile.created_at ? `📅 *Membre depuis:* ${new Date(profile.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}` : null,
      '',
      `🌊 _Recherche effectuée par le Water Hashira_`
    ].filter(Boolean).join('\n');

    // Send profile picture as image with caption
    if (profile.avatar_url) {
      try {
        await this.sock.sendMessage(jid, {
          image: { url: profile.avatar_url },
          caption: gitText,
          quoted: message,
          contextInfo: {
            isForwarded: false,
            forwardingScore: 0
          }
        });
        log.info(`GitHub profile sent for user: ${username}`);
      } catch (error) {
        log.error('Failed to send GitHub profile image:', error.message);
        // Fallback to text-only message
        await this.sendSafeMessage(jid, gitText, { 
          isCommandResponse: true, 
          title: 'GITHUB PROFILE',
          type: 'special',
          quotedMessage: message
        });
      }
    } else {
      // No avatar, send text only
      await this.sendSafeMessage(jid, gitText, { 
        isCommandResponse: true, 
        title: 'GITHUB PROFILE',
        type: 'special',
        quotedMessage: message
      });
    }
  }

  async fetchGithubProfileByUsername(username) {
    if (!username) {
      log.warn('GitHub username not provided');
      return null;
    }

    try {
      const response = await fetch(`https://api.github.com/users/${username}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          log.warn(`GitHub user not found: ${username}`);
          return null;
        }
        throw new Error(`GitHub API returned ${response.status}`);
      }

      const data = await response.json();
      log.info(`Fetched GitHub profile for: ${username}`);
      return data;
    } catch (error) {
      log.error(`Failed to fetch GitHub profile for ${username}:`, error.message);
      return null;
    }
  }

  async fetchGithubProfile() {
    const username = CONFIG.creator.githubUsername;
    if (!username) {
      log.warn('GitHub username not configured');
      return null;
    }

    const now = Date.now();
    if (this.githubCache.data && now - this.githubCache.fetchedAt < GITHUB_CACHE_TTL_MS) {
      return this.githubCache.data;
    }

    const url = `https://api.github.com/users/${encodeURIComponent(username)}`;

    try {
      const data = await new Promise((resolve, reject) => {
        const request = https.get(
          url,
          {
            headers: {
              'User-Agent': 'AbyssFlow-Bot',
              Accept: 'application/vnd.github+json',
            },
            timeout: 5000,
          },
          (res) => {
            if (res.statusCode && res.statusCode >= 400) {
              reject(new Error(`GitHub HTTP ${res.statusCode}`));
              res.resume();
              return;
            }

            let body = '';
            res.on('data', (chunk) => {
              body += chunk.toString('utf-8');
            });
            res.on('end', () => {
              try {
                resolve(JSON.parse(body));
              } catch (error) {
                reject(error);
              }
            });
          }
        );

        request.on('error', reject);
        request.on('timeout', () => {
          request.destroy(new Error('GitHub request timeout'));
        });
      });

      this.githubCache = { data, fetchedAt: now };
      return data;
    } catch (error) {
      log.warn(`GitHub fetch failed: ${error.message}`);
      return null;
    }
  }

  async sendSafeMessage(jid, text, options = {}) {
    if (!this.sock) {
      log.warn('Cannot send message: No active socket connection');
      return;
    }

    const { 
      isCommandResponse = false, 
      title = null,
      type = 'info',
      quotedMessage = null
    } = options;
    
    const theme = THEMES[type] || THEMES.info;
    const maxWidth = 38;
    
    const formatMessage = (content, msgTitle = null) => {
      const box = { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' };
      let formatted = [];
      let messageLines = [];
      
      const processText = (text) => {
        const lines = text.split('\n');
        lines.forEach(line => {
          if (!line.trim()) {
            messageLines.push('');
            return;
          }
          const words = line.split(/\s+/);
          let currentLine = '';
          
          words.forEach(word => {
            if ((currentLine + ' ' + word).length > maxWidth - 6) {
              messageLines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = currentLine ? currentLine + ' ' + word : word;
            }
          });
          
          if (currentLine) messageLines.push(currentLine);
        });
      };

      processText(content);

      if (msgTitle) {
        const titleText = ` ${theme.icon} ${msgTitle} `;
        formatted.push(box.tl + '─'.repeat(Math.max(0, maxWidth - 2)) + box.tr);
        formatted.push(box.v + titleText + ' '.repeat(Math.max(0, maxWidth - titleText.length - 1)) + box.v);
        formatted.push(box.v + '─'.repeat(maxWidth) + box.v);
      } else {
        formatted.push(box.tl + '─'.repeat(maxWidth) + box.tr);
      }

      messageLines.forEach(line => {
        formatted.push(box.v + ' ' + line + ' '.repeat(Math.max(0, maxWidth - line.length - 1)) + box.v);
      });

      formatted.push(box.bl + '─'.repeat(maxWidth) + box.br);
      return formatted.join('\n');
    };
    
    let formattedText = text;
    if (isCommandResponse) {
      formattedText = formatMessage(text, title);
    }

    const minDelay = Math.max(0, CONFIG.minDelay);
    const maxDelay = Math.max(minDelay, CONFIG.maxDelay);
    const delay = Math.min(minDelay + (formattedText.length / 10), maxDelay);

    try {
      await this.sock.sendPresenceUpdate('composing', jid);
      await sleep(delay);
      
      const maxChunkSize = 1000;
      const chunks = [];
      for (let i = 0; i < formattedText.length; i += maxChunkSize) {
        chunks.push(formattedText.substring(i, i + maxChunkSize));
      }

      for (const chunk of chunks) {
        const messageOptions = { 
          text: chunk,
          contextInfo: { isForwarded: false, forwardingScore: 0 }
        };
        
        // Add quoted message if provided
        if (quotedMessage) {
          messageOptions.quoted = quotedMessage;
        }
        
        await this.sock.sendMessage(jid, messageOptions);
        if (chunks.length > 1) await sleep(300);
      }
      
      await this.sock.sendPresenceUpdate('paused', jid);
    } catch (error) {
      log.error('Send failure:', error.message);
      if (formattedText !== text) {
        try { await this.sock.sendMessage(jid, { text }); } catch (e) {}
      }
    }
  }

  withinRateLimit(jid) {
    const now = Date.now();
    const normalized = normalizeNumber(jid);
    const history = this.commandHistory.get(normalized) || [];
    const recent = history.filter((timestamp) => now - timestamp < RATE_WINDOW_MS);

    if (recent.length >= CONFIG.maxCommandsPerMinute) {
      this.commandHistory.set(normalized, recent);
      return false;
    }

    recent.push(now);
    this.commandHistory.set(normalized, recent);
    return true;
  }

  isOwner(jid) {
    if (!CONFIG.owners.length) {
      log.warn('No owners configured in BOT_OWNERS');
      return false;
    }
    
    const normalized = normalizeNumber(jid);
    
    // Log the original JID for debugging
    if (LOG_THRESHOLD >= LOG_LEVEL_MAP.info) {
      log.info(`Checking owner for JID: ${jid} -> Normalized: ${normalized}`);
    }

    const isOwnerResult = CONFIG.owners.some((owner) => {
      const ownerNorm = normalizeNumber(owner);
      // Check if numbers match (flexible matching)
      const match = normalized.includes(ownerNorm) || ownerNorm.includes(normalized) || 
                    normalized.endsWith(ownerNorm) || ownerNorm.endsWith(normalized);
      
      if (LOG_THRESHOLD >= LOG_LEVEL_MAP.info) {
        log.info(`  Comparing: ${normalized} vs ${ownerNorm} -> ${match ? 'MATCH ✓' : 'NO MATCH ✗'}`);
      }
      
      if (match) {
        log.info(`✅ Owner detected: ${normalized} matches ${ownerNorm}`);
      }
      
      return match;
    });

    if (!isOwnerResult && LOG_THRESHOLD >= LOG_LEVEL_MAP.info) {
      log.info(`❌ ${jid} is NOT an owner`);
    }

    return isOwnerResult;
  }

  async isGroupAdmin(groupId, participantId) {
    try {
      const groupMetadata = await this.sock.groupMetadata(groupId);
      const participant = groupMetadata.participants.find(p => p.id === participantId);
      return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    } catch (error) {
      log.error('Failed to check group admin status:', error.message);
      return false;
    }
  }

  async isBotGroupAdmin(groupId) {
    try {
      const groupMetadata = await this.sock.groupMetadata(groupId);
      const botJid = this.sock.user.id.split(':')[0] + '@s.whatsapp.net';
      const botParticipant = groupMetadata.participants.find(p => p.id === botJid);
      return botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');
    } catch (error) {
      log.error('Failed to check bot admin status:', error.message);
      return false;
    }
  }

  async cmdWelcome(groupId, args) {
    const settings = this.getGroupSettings(groupId);
    const subCmd = args[0]?.toLowerCase();

    if (!subCmd || subCmd === 'status') {
      // Show current status
      const status = settings.welcome.enabled ? '✅ Activé' : '❌ Désactivé';
      const message = [
        `*🌊 Configuration Message de Bienvenue*`,
        '',
        `📊 *Statut:* ${status}`,
        '',
        `📝 *Message Actuel:*`,
        settings.welcome.message,
        '',
        `*💡 Commandes:*`,
        `• \`${CONFIG.prefix}welcome on\` - Activer`,
        `• \`${CONFIG.prefix}welcome off\` - Désactiver`,
        `• \`${CONFIG.prefix}welcome set <message>\` - Définir le message`,
        '',
        `*Variables disponibles:*`,
        `• \`@user\` - Mention du nouveau membre`
      ].join('\n');

      await this.sendSafeMessage(groupId, message, {
        isCommandResponse: true,
        title: 'WELCOME CONFIG',
        type: 'info'
      });
    } else if (subCmd === 'on') {
      settings.welcome.enabled = true;
      this.saveGroupSettings();
      await this.sendSafeMessage(groupId, '✅ Messages de bienvenue activés!');
    } else if (subCmd === 'off') {
      settings.welcome.enabled = false;
      this.saveGroupSettings();
      await this.sendSafeMessage(groupId, '❌ Messages de bienvenue désactivés!');
    } else if (subCmd === 'set') {
      const newMessage = args.slice(1).join(' ');
      if (!newMessage) {
        await this.sendSafeMessage(groupId, '❌ Veuillez fournir un message!\n\nExemple: `*welcome set Bienvenue @user!`');
        return;
      }
      settings.welcome.message = newMessage;
      this.saveGroupSettings();
      await this.sendSafeMessage(groupId, `✅ Message de bienvenue mis à jour!\n\n*Nouveau message:*\n${newMessage}`);
    }
  }

  async cmdGoodbye(groupId, args) {
    const settings = this.getGroupSettings(groupId);
    const subCmd = args[0]?.toLowerCase();

    if (!subCmd || subCmd === 'status') {
      // Show current status
      const status = settings.goodbye.enabled ? '✅ Activé' : '❌ Désactivé';
      const message = [
        `*👋 Configuration Message d'Au Revoir*`,
        '',
        `📊 *Statut:* ${status}`,
        '',
        `📝 *Message Actuel:*`,
        settings.goodbye.message,
        '',
        `*💡 Commandes:*`,
        `• \`${CONFIG.prefix}goodbye on\` - Activer`,
        `• \`${CONFIG.prefix}goodbye off\` - Désactiver`,
        `• \`${CONFIG.prefix}goodbye set <message>\` - Définir le message`,
        '',
        `*Variables disponibles:*`,
        `• \`@user\` - Mention du membre parti`
      ].join('\n');

      await this.sendSafeMessage(groupId, message, {
        isCommandResponse: true,
        title: 'GOODBYE CONFIG',
        type: 'info'
      });
    } else if (subCmd === 'on') {
      settings.goodbye.enabled = true;
      this.saveGroupSettings();
      await this.sendSafeMessage(groupId, '✅ Messages d\'au revoir activés!');
    } else if (subCmd === 'off') {
      settings.goodbye.enabled = false;
      this.saveGroupSettings();
      await this.sendSafeMessage(groupId, '❌ Messages d\'au revoir désactivés!');
    } else if (subCmd === 'set') {
      const newMessage = args.slice(1).join(' ');
      if (!newMessage) {
        await this.sendSafeMessage(groupId, '❌ Veuillez fournir un message!\n\nExemple: `*goodbye set Au revoir @user!`');
        return;
      }
      settings.goodbye.message = newMessage;
      this.saveGroupSettings();
      await this.sendSafeMessage(groupId, `✅ Message d'au revoir mis à jour!\n\n*Nouveau message:*\n${newMessage}`);
    }
  }

  async cmdBotStatus(groupId) {
    try {
      const groupMetadata = await this.sock.groupMetadata(groupId);
      
      // Try multiple formats to find the bot's JID
      const possibleBotJids = [
        this.sock.user.id,
        this.sock.user.id.replace(/:\d+/, '@s.whatsapp.net'),
        this.sock.user.id.split(':')[0] + '@s.whatsapp.net',
        this.sock.user.id.split('@')[0] + '@s.whatsapp.net'
      ];
      
      let botParticipant = null;
      let botJid = null;
      
      for (const jid of possibleBotJids) {
        botParticipant = groupMetadata.participants.find(p => p.id === jid);
        if (botParticipant) {
          botJid = jid;
          break;
        }
      }
      
      const totalMembers = groupMetadata.participants.length;
      const admins = groupMetadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
      const isAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');
      
      const statusMsg = [
        `*🤖 Statut du Bot dans ce Groupe*`,
        '',
        `📱 *JID du Bot:*`,
        `\`${this.sock.user.id}\``,
        '',
        `🔍 *JID Détecté:*`,
        `\`${botJid || 'NON TROUVÉ'}\``,
        '',
        `👥 *Groupe:*`,
        `• Nom: ${groupMetadata.subject}`,
        `• Membres: ${totalMembers}`,
        `• Admins: ${admins.length}`,
        '',
        `🛡️ *Statut du Bot:*`,
        botParticipant ? (
          isAdmin 
            ? `✅ *Admin du groupe*` 
            : `⚠️ *Membre normal (pas admin)*`
        ) : `❌ *Pas membre du groupe*`,
        '',
        `💡 *Permissions:*`,
        isAdmin 
          ? `✅ Peut utiliser *kick, *promote, *demote` 
          : `❌ Rendez le bot admin pour utiliser les commandes de modération`,
        '',
        isAdmin ? '' : [
          `*📋 Pour rendre le bot admin:*`,
          `1. Infos du groupe → Participants`,
          `2. Trouvez le bot`,
          `3. Appuyez longuement → "Promouvoir en admin"`
        ].join('\n')
      ].filter(Boolean).join('\n');
      
      await this.sendSafeMessage(groupId, statusMsg, {
        isCommandResponse: true,
        title: 'BOT STATUS',
        type: 'info'
      });
      
    } catch (error) {
      log.error('Failed to get bot status:', error.message);
      await this.sendSafeMessage(groupId, `❌ Erreur lors de la récupération du statut: ${error.message}`);
    }
  }

  async cmdKick(groupId, message, args, canBypassBotCheck = false) {
    try {
      // Extract mentioned users from the message
      const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      
      // Check if there are any mentions
      if (mentionedJids.length === 0) {
        await this.sendSafeMessage(groupId, [
          `❌ *Aucun membre mentionné!*`,
          '',
          `*💡 Utilisation:*`,
          `\`${CONFIG.prefix}kick @user1 @user2 ...\``,
          '',
          `*Exemples:*`,
          `• \`${CONFIG.prefix}kick @user\` - Expulser un membre`,
          `• \`${CONFIG.prefix}remove @user1 @user2\` - Expulser plusieurs`,
          '',
          `⚠️ *Note:* Mentionnez les membres à expulser`
        ].join('\n'));
        return;
      }

      // Get group metadata to check bot's admin status
      const groupMetadata = await this.sock.groupMetadata(groupId);
      
      // Try multiple formats to find the bot's JID
      const possibleBotJids = [
        this.sock.user.id,
        this.sock.user.id.replace(/:\d+/, '@s.whatsapp.net'),
        this.sock.user.id.split(':')[0] + '@s.whatsapp.net',
        this.sock.user.id.split('@')[0] + '@s.whatsapp.net'
      ];
      
      let botParticipant = null;
      let botJid = null;
      
      for (const jid of possibleBotJids) {
        botParticipant = groupMetadata.participants.find(p => p.id === jid);
        if (botParticipant) {
          botJid = jid;
          break;
        }
      }
      
      // Debug logging
      if (LOG_THRESHOLD >= LOG_LEVEL_MAP.info) {
        log.info(`Bot user ID: ${this.sock.user.id}`);
        log.info(`Bot JID found: ${botJid || 'NOT FOUND'}`);
        log.info(`Bot is admin: ${botParticipant ? (botParticipant.admin || 'no') : 'NOT IN GROUP'}`);
        log.info(`Can bypass bot check: ${canBypassBotCheck}`);
      }
      
      // If bot not found in participants
      if (!botParticipant) {
        // If user can bypass (owner or group admin), allow to try anyway with warning
        if (canBypassBotCheck) {
          log.warn(`Admin attempting kick without bot found in participants for ${groupId}`);
          await this.sendSafeMessage(groupId, [
            `⚠️ *Attention: Le bot n'est pas détecté dans le groupe!*`,
            '',
            `Tentative d'expulsion en tant qu'administrateur...`,
            `Cela peut échouer si le bot n'a pas les permissions.`,
            ''
          ].join('\n'));
          // Continue to try the kick
        } else {
          // For regular users, block the command
          await this.sendSafeMessage(groupId, '❌ Le bot n\'est pas membre de ce groupe!');
          return;
        }
      } else {
        // Bot found, check admin status
        const isBotAdmin = botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin';
        
        // If bot is not admin and user cannot bypass, block the command
        if (!isBotAdmin && !canBypassBotCheck) {
          await this.sendSafeMessage(groupId, [
            `❌ *Le bot doit être admin du groupe!*`,
            '',
            `📊 *Statut actuel:* Membre normal`,
            '',
            `💡 *Pour rendre le bot admin:*`,
            `1. Infos du groupe → Participants`,
            `2. Trouvez le bot dans la liste`,
            `3. Appuyez longuement → "Promouvoir en admin"`
          ].join('\n'));
          return;
        }
        
        // If bot is not admin but user can bypass, try anyway with warning
        if (!isBotAdmin && canBypassBotCheck) {
          log.warn(`Admin attempting kick without bot admin privileges in ${groupId}`);
          await this.sendSafeMessage(groupId, [
            `⚠️ *Attention: Le bot n'est pas admin!*`,
            '',
            `Tentative d'expulsion en tant qu'administrateur...`,
            `Cela peut échouer si WhatsApp bloque l'action.`,
            ''
          ].join('\n'));
          // Continue to try the kick
        }
      }

      // Prevent kicking other admins (safety measure)
      const admins = groupMetadata.participants
        .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
        .map(p => p.id);

      const membersToKick = [];
      const protectedMembers = [];

      for (const jid of mentionedJids) {
        if (admins.includes(jid)) {
          protectedMembers.push(jid);
        } else {
          membersToKick.push(jid);
        }
      }

      // Show warning if trying to kick admins
      if (protectedMembers.length > 0) {
        await this.sendSafeMessage(groupId, [
          `⚠️ *Impossible d'expulser les admins!*`,
          '',
          `${protectedMembers.length} admin(s) protégé(s)`,
          '',
          `💡 Révoquez d'abord leurs privilèges admin`
        ].join('\n'));
      }

      // Kick the members
      if (membersToKick.length > 0) {
        await this.sock.groupParticipantsUpdate(groupId, membersToKick, 'remove');
        
        const kickedList = membersToKick.map(jid => `• @${jid.split('@')[0]}`).join('\n');
        
        await this.sock.sendMessage(groupId, {
          text: [
            `✅ *Membres expulsés avec succès!*`,
            '',
            `👥 *${membersToKick.length} membre(s) expulsé(s):*`,
            kickedList,
            '',
            `🌊 _Action effectuée par le Water Hashira_`
          ].join('\n'),
          mentions: membersToKick
        });

        log.info(`Kicked ${membersToKick.length} member(s) from ${groupId}`);
      } else if (protectedMembers.length > 0) {
        // Only admins were mentioned
        return;
      } else {
        await this.sendSafeMessage(groupId, '❌ Aucun membre valide à expulser!');
      }

    } catch (error) {
      log.error('Failed to kick members:', error.message);
      await this.sendSafeMessage(groupId, `❌ Erreur lors de l'expulsion: ${error.message}`);
    }
  }

  async cmdPromote(groupId, message, args) {
    try {
      // Extract mentioned users from the message
      const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      
      // Check if there are any mentions
      if (mentionedJids.length === 0) {
        await this.sendSafeMessage(groupId, [
          `❌ *Aucun membre mentionné!*`,
          '',
          `*💡 Utilisation:*`,
          `\`${CONFIG.prefix}promote @user1 @user2 ...\``,
          '',
          `*Exemples:*`,
          `• \`${CONFIG.prefix}promote @user\` - Promouvoir un membre`,
          `• \`${CONFIG.prefix}promote @user1 @user2\` - Promouvoir plusieurs`,
          '',
          `⚠️ *Note:* Mentionnez les membres à promouvoir en admin`
        ].join('\n'));
        return;
      }

      // Check if bot is admin
      const isBotAdmin = await this.isBotGroupAdmin(groupId);
      if (!isBotAdmin) {
        await this.sendSafeMessage(groupId, [
          `❌ *Impossible de promouvoir!*`,
          '',
          `⚠️ Le bot doit être admin du groupe pour promouvoir des membres.`,
          '',
          `💡 *Solution:* Promouvoir le bot en admin du groupe`
        ].join('\n'), { quotedMessage: message });
        return;
      }

      // Get group metadata
      const groupMetadata = await this.sock.groupMetadata(groupId);

      // Get current admins
      const currentAdmins = groupMetadata.participants
        .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
        .map(p => p.id);

      const membersToPromote = [];
      const alreadyAdmins = [];

      for (const jid of mentionedJids) {
        if (currentAdmins.includes(jid)) {
          alreadyAdmins.push(jid);
        } else {
          membersToPromote.push(jid);
        }
      }

      // Show info if some are already admins
      if (alreadyAdmins.length > 0) {
        const adminList = alreadyAdmins.map(jid => `• @${jid.split('@')[0]}`).join('\n');
        await this.sendSafeMessage(groupId, [
          `ℹ️ *Déjà administrateur(s):*`,
          '',
          adminList
        ].join('\n'), { mentions: alreadyAdmins });
      }

      // Promote the members
      if (membersToPromote.length > 0) {
        await this.sock.groupParticipantsUpdate(groupId, membersToPromote, 'promote');
        
        const promotedList = membersToPromote.map(jid => `• @${jid.split('@')[0]}`).join('\n');
        
        await this.sock.sendMessage(groupId, {
          text: [
            `✅ *Promotion réussie!*`,
            '',
            `👑 *${membersToPromote.length} nouveau(x) admin(s):*`,
            promotedList,
            '',
            `🎉 Félicitations pour votre promotion!`,
            '',
            `🌊 _Action effectuée par le Water Hashira_`
          ].join('\n'),
          mentions: membersToPromote
        });

        log.info(`Promoted ${membersToPromote.length} member(s) in ${groupId}`);
      } else if (alreadyAdmins.length > 0) {
        // Only already-admins were mentioned
        return;
      } else {
        await this.sendSafeMessage(groupId, '❌ Aucun membre valide à promouvoir!');
      }

    } catch (error) {
      log.error('Failed to promote members:', error.message);
      await this.sendSafeMessage(groupId, `❌ Erreur lors de la promotion: ${error.message}`);
    }
  }

  async cmdDemote(groupId, message, args) {
    try {
      // Extract mentioned users from the message
      const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      
      // Check if there are any mentions
      if (mentionedJids.length === 0) {
        await this.sendSafeMessage(groupId, [
          `❌ *Aucun membre mentionné!*`,
          '',
          `*💡 Utilisation:*`,
          `\`${CONFIG.prefix}demote @admin1 @admin2 ...\``,
          '',
          `*Exemples:*`,
          `• \`${CONFIG.prefix}demote @admin\` - Révoquer un admin`,
          `• \`${CONFIG.prefix}demote @admin1 @admin2\` - Révoquer plusieurs`,
          '',
          `⚠️ *Note:* Mentionnez les admins à révoquer`,
          `⚠️ *Attention:* Peut révoquer même le créateur du groupe!`
        ].join('\n'));
        return;
      }

      // Check if bot is admin
      const isBotAdmin = await this.isBotGroupAdmin(groupId);
      if (!isBotAdmin) {
        await this.sendSafeMessage(groupId, [
          `❌ *Impossible de révoquer!*`,
          '',
          `⚠️ Le bot doit être admin du groupe pour révoquer des admins.`,
          '',
          `💡 *Solution:* Promouvoir le bot en admin du groupe`
        ].join('\n'), { quotedMessage: message });
        return;
      }

      // Get group metadata
      const groupMetadata = await this.sock.groupMetadata(groupId);

      // Get current admins
      const currentAdmins = groupMetadata.participants
        .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
        .map(p => p.id);

      const membersToDemote = [];
      const notAdmins = [];
      const groupCreators = [];

      for (const jid of mentionedJids) {
        const participant = groupMetadata.participants.find(p => p.id === jid);
        
        if (!currentAdmins.includes(jid)) {
          notAdmins.push(jid);
        } else if (participant && participant.admin === 'superadmin') {
          // Warn about demoting group creator but still allow it
          groupCreators.push(jid);
          membersToDemote.push(jid);
        } else {
          membersToDemote.push(jid);
        }
      }

      // Show info if some are not admins
      if (notAdmins.length > 0) {
        const notAdminList = notAdmins.map(jid => `• @${jid.split('@')[0]}`).join('\n');
        await this.sendSafeMessage(groupId, [
          `ℹ️ *Déjà membre(s) normal(aux):*`,
          '',
          notAdminList
        ].join('\n'), { mentions: notAdmins });
      }

      // Warn if demoting group creator(s)
      if (groupCreators.length > 0) {
        const creatorList = groupCreators.map(jid => `• @${jid.split('@')[0]}`).join('\n');
        await this.sendSafeMessage(groupId, [
          `⚠️ *ATTENTION: Révocation du créateur du groupe!*`,
          '',
          creatorList,
          '',
          `Cette action va révoquer le créateur du groupe.`,
          `Procédure en cours...`
        ].join('\n'), { mentions: groupCreators });
      }

      // Demote the members
      if (membersToDemote.length > 0) {
        await this.sock.groupParticipantsUpdate(groupId, membersToDemote, 'demote');
        
        const demotedList = membersToDemote.map(jid => `• @${jid.split('@')[0]}`).join('\n');
        
        await this.sock.sendMessage(groupId, {
          text: [
            `✅ *Révocation réussie!*`,
            '',
            `👤 *${membersToDemote.length} admin(s) révoqué(s):*`,
            demotedList,
            '',
            groupCreators.length > 0 ? `⚠️ Créateur(s) du groupe révoqué(s)` : '',
            `📊 Statut: Membre normal`,
            '',
            `🌊 _Action effectuée par le Water Hashira_`
          ].filter(Boolean).join('\n'),
          mentions: membersToDemote
        });

        log.info(`Demoted ${membersToDemote.length} admin(s) in ${groupId}`);
      } else if (notAdmins.length > 0) {
        // Only non-admins were mentioned
        return;
      } else {
        await this.sendSafeMessage(groupId, '❌ Aucun admin valide à révoquer!');
      }

    } catch (error) {
      log.error('Failed to demote admins:', error.message);
      await this.sendSafeMessage(groupId, `❌ Erreur lors de la révocation: ${error.message}`);
    }
  }

  async cmdOpenGroup(groupId, message) {
    try {
      // Get group metadata
      const groupMetadata = await this.sock.groupMetadata(groupId);
      const groupName = groupMetadata.subject || 'Groupe';

      // Change group settings to allow all participants to send messages
      // WhatsApp will handle permissions - only group admins can do this
      await this.sock.groupSettingUpdate(groupId, 'not_announcement');
      
      await this.sock.sendMessage(groupId, {
        text: [
          `🔓 *Groupe Ouvert!*`,
          '',
          `📢 *${groupName}*`,
          '',
          `✅ Tous les membres peuvent maintenant envoyer des messages`,
          `💬 Le groupe est ouvert à la discussion`,
          '',
          `🌊 _Action effectuée par le Water Hashira_`
        ].join('\n'),
        quoted: message
      });

      log.info(`Group ${groupId} opened (not_announcement mode)`);

    } catch (error) {
      log.error('Failed to open group:', error.message);
      
      // Check if error is due to lack of permissions
      if (error.message.includes('not-authorized') || error.message.includes('forbidden')) {
        await this.sendSafeMessage(groupId, [
          `❌ *Impossible d'ouvrir le groupe!*`,
          '',
          `⚠️ Seuls les admins du groupe peuvent modifier ces paramètres.`,
          '',
          `💡 *Note:* Cette commande change les paramètres WhatsApp du groupe,`,
          `elle nécessite que l'utilisateur soit admin du groupe (pas le bot).`
        ].join('\n'));
      } else {
        await this.sendSafeMessage(groupId, `❌ Erreur lors de l'ouverture du groupe: ${error.message}`);
      }
    }
  }

  async cmdCloseGroup(groupId, message) {
    try {
      // Get group metadata
      const groupMetadata = await this.sock.groupMetadata(groupId);
      const groupName = groupMetadata.subject || 'Groupe';

      // Change group settings to only allow admins to send messages
      // WhatsApp will handle permissions - only group admins can do this
      await this.sock.groupSettingUpdate(groupId, 'announcement');
      
      await this.sock.sendMessage(groupId, {
        text: [
          `🔒 *Groupe Fermé!*`,
          '',
          `📢 *${groupName}*`,
          '',
          `🛡️ Seuls les admins peuvent maintenant envoyer des messages`,
          `📵 Les membres normaux ne peuvent plus écrire`,
          '',
          `💡 *Pour rouvrir:* Utilisez \`${CONFIG.prefix}open\``,
          '',
          `🌊 _Action effectuée par le Water Hashira_`
        ].join('\n'),
        quoted: message
      });

      log.info(`Group ${groupId} closed (announcement mode)`);

    } catch (error) {
      log.error('Failed to close group:', error.message);
      
      // Check if error is due to lack of permissions
      if (error.message.includes('not-authorized') || error.message.includes('forbidden')) {
        await this.sendSafeMessage(groupId, [
          `❌ *Impossible de fermer le groupe!*`,
          '',
          `⚠️ Seuls les admins du groupe peuvent modifier ces paramètres.`,
          '',
          `💡 *Note:* Cette commande change les paramètres WhatsApp du groupe,`,
          `elle nécessite que l'utilisateur soit admin du groupe (pas le bot).`
        ].join('\n'));
      } else {
        await this.sendSafeMessage(groupId, `❌ Erreur lors de la fermeture du groupe: ${error.message}`);
      }
    }
  }

  async cmdAdd(groupId, message, args, canBypassBotCheck = false) {
    try {
      // Check if numbers are provided in args
      if (args.length === 0) {
        await this.sendSafeMessage(groupId, [
          `❌ *Aucun numéro fourni!*`,
          '',
          `*💡 Utilisation:*`,
          `\`${CONFIG.prefix}add [code pays][numéro] ...\``,
          '',
          `*Exemples:*`,
          `• \`${CONFIG.prefix}add 237681752094\` - Cameroun`,
          `• \`${CONFIG.prefix}add 33612345678\` - France`,
          `• \`${CONFIG.prefix}add 1234567890\` - USA/Canada`,
          `• \`${CONFIG.prefix}add 237681752094 33612345678\` - Plusieurs pays`,
          '',
          `*Codes pays populaires:*`,
          `• 237 - Cameroun 🇨🇲`,
          `• 33 - France 🇫🇷`,
          `• 1 - USA/Canada 🇺🇸🇨🇦`,
          `• 44 - UK 🇬🇧`,
          `• 49 - Allemagne 🇩🇪`,
          `• 234 - Nigeria 🇳🇬`,
          `• 225 - Côte d'Ivoire 🇨🇮`,
          '',
          `⚠️ *Note:* Utilisez les numéros sans espaces ni symboles`,
          `Format: Code pays + numéro (ex: 237681752094)`
        ].join('\n'));
        return;
      }

      // Get group metadata to check bot's admin status
      const groupMetadata = await this.sock.groupMetadata(groupId);
      
      // Try multiple formats to find the bot's JID
      const possibleBotJids = [
        this.sock.user.id,
        this.sock.user.id.replace(/:\d+/, '@s.whatsapp.net'),
        this.sock.user.id.split(':')[0] + '@s.whatsapp.net',
        this.sock.user.id.split('@')[0] + '@s.whatsapp.net'
      ];
      
      let botParticipant = null;
      let botJid = null;
      
      for (const jid of possibleBotJids) {
        botParticipant = groupMetadata.participants.find(p => p.id === jid);
        if (botParticipant) {
          botJid = jid;
          break;
        }
      }
      
      // Debug logging
      if (LOG_THRESHOLD >= LOG_LEVEL_MAP.info) {
        log.info(`Bot user ID: ${this.sock.user.id}`);
        log.info(`Bot JID found: ${botJid || 'NOT FOUND'}`);
        log.info(`Bot is admin: ${botParticipant ? (botParticipant.admin || 'no') : 'NOT IN GROUP'}`);
        log.info(`Can bypass bot check: ${canBypassBotCheck}`);
      }
      
      // If bot not found in participants
      if (!botParticipant) {
        // If user can bypass (owner or group admin), allow to try anyway with warning
        if (canBypassBotCheck) {
          log.warn(`Admin attempting add without bot found in participants for ${groupId}`);
          await this.sendSafeMessage(groupId, [
            `⚠️ *Attention: Le bot n'est pas détecté dans le groupe!*`,
            '',
            `Tentative d'ajout en tant qu'administrateur...`,
            `Cela peut échouer si le bot n'a pas les permissions.`,
            ''
          ].join('\n'));
          // Continue to try the add
        } else {
          // For regular users, block the command
          await this.sendSafeMessage(groupId, '❌ Le bot n\'est pas membre de ce groupe!');
          return;
        }
      } else {
        // Bot found, check admin status
        const isBotAdmin = botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin';
        
        // If bot is not admin and user cannot bypass, block the command
        if (!isBotAdmin && !canBypassBotCheck) {
          await this.sendSafeMessage(groupId, [
            `❌ *Le bot doit être admin du groupe!*`,
            '',
            `📊 *Statut actuel:* Membre normal`,
            '',
            `💡 *Pour rendre le bot admin:*`,
            `1. Infos du groupe → Participants`,
            `2. Trouvez le bot dans la liste`,
            `3. Appuyez longuement → "Promouvoir en admin"`
          ].join('\n'));
          return;
        }
        
        // If bot is not admin but user can bypass, try anyway with warning
        if (!isBotAdmin && canBypassBotCheck) {
          log.warn(`Admin attempting add without bot admin privileges in ${groupId}`);
          await this.sendSafeMessage(groupId, [
            `⚠️ *Attention: Le bot n'est pas admin!*`,
            '',
            `Tentative d'ajout en tant qu'administrateur...`,
            `Cela peut échouer si WhatsApp bloque l'action.`,
            ''
          ].join('\n'));
          // Continue to try the add
        }
      }

      // Parse phone numbers from args
      const numbersToAdd = [];
      const invalidNumbers = [];
      
      for (const arg of args) {
        // Clean the number (remove spaces, dashes, etc.)
        const cleanNumber = arg.replace(/[\s\-\(\)]/g, '');
        
        // Check if it's a valid number (digits only)
        if (/^\d+$/.test(cleanNumber)) {
          // Add @s.whatsapp.net format
          numbersToAdd.push(`${cleanNumber}@s.whatsapp.net`);
        } else {
          invalidNumbers.push(arg);
        }
      }
      
      // Show warning for invalid numbers
      if (invalidNumbers.length > 0) {
        await this.sendSafeMessage(groupId, [
          `⚠️ *Numéros invalides ignorés:*`,
          invalidNumbers.map(n => `• ${n}`).join('\n'),
          '',
          `Utilise uniquement des chiffres (ex: 237681752094)`
        ].join('\n'));
      }
      
      // Check if there are valid numbers to add
      if (numbersToAdd.length === 0) {
        await this.sendSafeMessage(groupId, '❌ Aucun numéro valide à ajouter!');
        return;
      }
      
      // Check which numbers are already in the group
      const existingMembers = groupMetadata.participants.map(p => p.id);
      const alreadyInGroup = [];
      const toAdd = [];
      
      for (const jid of numbersToAdd) {
        if (existingMembers.includes(jid)) {
          alreadyInGroup.push(jid);
        } else {
          toAdd.push(jid);
        }
      }
      
      // Show warning for members already in group
      if (alreadyInGroup.length > 0) {
        await this.sendSafeMessage(groupId, [
          `ℹ️ *Déjà membres du groupe:*`,
          alreadyInGroup.map(jid => `• @${jid.split('@')[0]}`).join('\n')
        ].join('\n'));
      }
      
      // Add the members
      if (toAdd.length > 0) {
        const result = await this.sock.groupParticipantsUpdate(groupId, toAdd, 'add');
        
        // Analyze results
        const added = [];
        const failed = [];
        
        for (let i = 0; i < toAdd.length; i++) {
          const jid = toAdd[i];
          const status = result[i]?.status || result[jid]?.status;
          
          if (status === 200 || status === '200') {
            added.push(jid);
          } else {
            failed.push({ jid, status });
          }
        }
        
        // Success message
        if (added.length > 0) {
          const addedList = added.map(jid => `• @${jid.split('@')[0]}`).join('\n');
          
          await this.sock.sendMessage(groupId, {
            text: [
              `✅ *Membres ajoutés avec succès!*`,
              '',
              `👥 *${added.length} membre(s) ajouté(s):*`,
              addedList,
              '',
              `🌊 _Action effectuée par le Water Hashira_`
            ].join('\n'),
            mentions: added
          });
          
          log.info(`Added ${added.length} member(s) to ${groupId}`);
        }
        
        // Failure message - Send invite link to failed members
        if (failed.length > 0) {
          const failedList = failed.map(f => `• @${f.jid.split('@')[0]} (Code: ${f.status})`).join('\n');
          
          // Get group invite link
          let inviteLink = null;
          try {
            const inviteCode = await this.sock.groupInviteCode(groupId);
            inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
          } catch (error) {
            log.error('Failed to get invite link:', error.message);
          }
          
          // Send invite link to each failed member
          let sentInvites = 0;
          for (const f of failed) {
            if (f.status === 403 || f.status === '403') {
              // Privacy settings - send invite link
              if (inviteLink) {
                try {
                  await this.sock.sendMessage(f.jid, {
                    text: [
                      `👋 *Invitation au Groupe*`,
                      '',
                      `Vous avez été invité à rejoindre un groupe WhatsApp!`,
                      '',
                      `🔗 *Lien d'invitation:*`,
                      inviteLink,
                      '',
                      `💡 Cliquez sur le lien pour rejoindre le groupe.`,
                      '',
                      `🌊 _Invitation envoyée par le Water Hashira_`
                    ].join('\n')
                  });
                  sentInvites++;
                  log.info(`Sent invite link to ${f.jid}`);
                  
                  // Wait 1 second between messages to avoid spam detection
                  await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                  log.error(`Failed to send invite to ${f.jid}:`, error.message);
                }
              }
            }
          }
          
          // Notify in group
          await this.sendSafeMessage(groupId, [
            `⚠️ *Impossible d'ajouter directement certains membres:*`,
            '',
            failedList,
            '',
            sentInvites > 0 ? [
              `✅ *${sentInvites} lien(s) d'invitation envoyé(s) en privé!*`,
              '',
              `Les membres recevront le lien du groupe par message privé.`
            ].join('\n') : '',
            '',
            `*Raisons possibles:*`,
            `• Paramètres de confidentialité (Code 403)`,
            `• Numéro invalide ou inexistant (Code 404)`,
            `• Membre a bloqué le bot`,
            `• Membre a quitté récemment (Code 409)`
          ].filter(Boolean).join('\n'));
          
          log.warn(`Failed to add ${failed.length} member(s) to ${groupId}, sent ${sentInvites} invite link(s)`);
        }
        
        if (added.length === 0 && failed.length === 0) {
          await this.sendSafeMessage(groupId, '❌ Aucun membre n\'a pu être ajouté!');
        }
        
      } else if (alreadyInGroup.length > 0) {
        // All members already in group
        return;
      } else {
        await this.sendSafeMessage(groupId, '❌ Aucun membre valide à ajouter!');
      }

    } catch (error) {
      log.error('Failed to add members:', error.message);
      await this.sendSafeMessage(groupId, `❌ Erreur lors de l'ajout: ${error.message}`);
    }
  }

  async cmdTagAll(groupId, message, args) {
    try {
      // Get group metadata
      const groupMetadata = await this.sock.groupMetadata(groupId);
      
      // Get all participants
      const participants = groupMetadata.participants.map(p => p.id);
      
      if (participants.length === 0) {
        await this.sendSafeMessage(groupId, '❌ Aucun membre dans le groupe!');
        return;
      }
      
      // Extract custom message from args
      const customMessage = args.join(' ');
      
      // Build the message
      const tagMessage = [
        customMessage || '📢 *Annonce Importante!*',
        '',
        '👥 *Membres mentionnés:*',
        participants.map(jid => `@${jid.split('@')[0]}`).join(' '),
        '',
        `📊 *Total:* ${participants.length} membre(s)`,
        '',
        `🌊 _Message envoyé par le Water Hashira_`
      ].join('\n');
      
      // Send message with mentions
      await this.sock.sendMessage(groupId, {
        text: tagMessage,
        mentions: participants
      });
      
      log.info(`Tagged all ${participants.length} members in ${groupId}`);
      
    } catch (error) {
      log.error('Failed to tag all members:', error.message);
      await this.sendSafeMessage(groupId, `❌ Erreur lors du tag: ${error.message}`);
    }
  }

  async cmdGroupInfo(groupId, message) {
    try {
      // Get group metadata
      const groupMetadata = await this.sock.groupMetadata(groupId);
      
      // Get group name
      const groupName = groupMetadata.subject || 'Groupe Sans Nom';
      
      // Get group description
      const groupDesc = groupMetadata.desc || 'Aucune description';
      
      // Get creation date
      const creationDate = groupMetadata.creation ? new Date(groupMetadata.creation * 1000).toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) : 'Inconnue';
      
      // Get participants
      const participants = groupMetadata.participants;
      const totalMembers = participants.length;
      
      // Get admins
      const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
      const adminList = admins.map(admin => `• @${admin.id.split('@')[0]}`).join('\n');
      
      // Build the info text
      const groupInfoText = [
        `*📱 ${groupName}*`,
        '',
        `📝 *Description:*`,
        groupDesc,
        '',
        `👥 *Membres:* ${totalMembers}`,
        `👑 *Administrateurs:* ${admins.length}`,
        '',
        `*🛡️ Liste des Admins:*`,
        adminList,
        '',
        `📅 *Créé le:* ${creationDate}`,
        '',
        `💡 *Note Importante:*`,
        `Pour toute question ou problème, veuillez contacter les administrateurs du groupe au préalable.`,
        '',
        `🌊 _Informations fournies par le Water Hashira_`
      ].join('\n');
      
      // Try to get group picture
      let groupPictureUrl = null;
      try {
        groupPictureUrl = await this.sock.profilePictureUrl(groupId, 'image');
      } catch (error) {
        log.warn('No group picture available');
      }
      
      // Send with group picture if available
      if (groupPictureUrl) {
        try {
          await this.sock.sendMessage(groupId, {
            image: { url: groupPictureUrl },
            caption: groupInfoText,
            quoted: message,
            mentions: admins.map(a => a.id),
            contextInfo: {
              isForwarded: false,
              forwardingScore: 0
            }
          });
          log.info(`Group info sent with picture for ${groupId}`);
        } catch (error) {
          log.error('Failed to send group info with picture:', error.message);
          // Fallback to text-only message
          await this.sock.sendMessage(groupId, {
            text: groupInfoText,
            quoted: message,
            mentions: admins.map(a => a.id)
          });
        }
      } else {
        // No picture, send text only
        await this.sock.sendMessage(groupId, {
          text: groupInfoText,
          quoted: message,
          mentions: admins.map(a => a.id)
        });
      }
      
    } catch (error) {
      log.error('Failed to get group info:', error.message);
      await this.sendSafeMessage(groupId, `❌ Erreur lors de la récupération des infos: ${error.message}`, {
        quotedMessage: message
      });
    }
  }

  async cmdViewOnce(chatId, message) {
    try {
      // Check if message is a reply to a view once message
      const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      
      if (!quotedMessage) {
        await this.sendSafeMessage(chatId, [
          `❌ *Aucun message "Vue unique" détecté!*`,
          '',
          `*💡 Utilisation:*`,
          `1. Répondez à un message "Vue unique"`,
          `2. Tapez \`${CONFIG.prefix}viewonce\``,
          '',
          `*Exemples:*`,
          `• \`${CONFIG.prefix}viewonce\` - Extraire le média`,
          `• \`${CONFIG.prefix}antiviewonce\` - Alias`,
          `• \`${CONFIG.prefix}revealvo\` - Alias`,
          '',
          `⚠️ *Note:* Le message doit être une vue unique (image/vidéo)`,
          '',
          `🌊 _Water Hashira - Anti Vue Unique_`
        ].join('\n'), { quotedMessage: message });
        return;
      }

      // Check if it's a view once message
      const viewOnceMessage = quotedMessage.viewOnceMessage || quotedMessage.viewOnceMessageV2 || quotedMessage.viewOnceMessageV2Extension;
      
      if (!viewOnceMessage) {
        await this.sendSafeMessage(chatId, [
          `❌ *Ce n'est pas un message "Vue unique"!*`,
          '',
          `Le message cité doit être une photo ou vidéo en vue unique.`,
          '',
          `🌊 _Water Hashira_`
        ].join('\n'), { quotedMessage: message });
        return;
      }

      log.info(`View once message detected in ${chatId}`);

      // Extract the actual message from view once wrapper
      const actualMessage = viewOnceMessage.message;
      
      if (!actualMessage) {
        await this.sendSafeMessage(chatId, '❌ Impossible d\'extraire le contenu du message vue unique.', { quotedMessage: message });
        return;
      }

      // Get sender info
      const sender = message.message?.extendedTextMessage?.contextInfo?.participant || 'Inconnu';
      const senderName = `@${sender.split('@')[0]}`;

      // Send the media as normal (not view once)
      if (actualMessage.imageMessage) {
        log.info('Extracting view once image');
        await this.sock.sendMessage(chatId, {
          image: actualMessage.imageMessage.url ? { url: actualMessage.imageMessage.url } : actualMessage.imageMessage,
          caption: [
            `📸 *Image Vue Unique Extraite*`,
            '',
            `👤 *Envoyé par:* ${senderName}`,
            '',
            actualMessage.imageMessage.caption ? `📝 *Légende:* ${actualMessage.imageMessage.caption}` : '',
            '',
            `🌊 _Extrait par le Water Hashira - Anti Vue Unique_`
          ].filter(line => line !== '').join('\n'),
          mentions: [sender]
        });
        log.info('View once image extracted successfully');
      } 
      else if (actualMessage.videoMessage) {
        log.info('Extracting view once video');
        await this.sock.sendMessage(chatId, {
          video: actualMessage.videoMessage.url ? { url: actualMessage.videoMessage.url } : actualMessage.videoMessage,
          caption: [
            `🎥 *Vidéo Vue Unique Extraite*`,
            '',
            `👤 *Envoyé par:* ${senderName}`,
            '',
            actualMessage.videoMessage.caption ? `📝 *Légende:* ${actualMessage.videoMessage.caption}` : '',
            '',
            `🌊 _Extrait par le Water Hashira - Anti Vue Unique_`
          ].filter(line => line !== '').join('\n'),
          mentions: [sender]
        });
        log.info('View once video extracted successfully');
      }
      else if (actualMessage.audioMessage) {
        log.info('Extracting view once audio');
        await this.sock.sendMessage(chatId, {
          audio: actualMessage.audioMessage.url ? { url: actualMessage.audioMessage.url } : actualMessage.audioMessage,
          mimetype: actualMessage.audioMessage.mimetype,
          ptt: actualMessage.audioMessage.ptt || false
        });
        await this.sendSafeMessage(chatId, [
          `🎵 *Audio Vue Unique Extrait*`,
          '',
          `👤 *Envoyé par:* ${senderName}`,
          '',
          `🌊 _Extrait par le Water Hashira - Anti Vue Unique_`
        ].join('\n'), { mentions: [sender] });
        log.info('View once audio extracted successfully');
      }
      else {
        await this.sendSafeMessage(chatId, [
          `❌ *Type de média non supporté*`,
          '',
          `Le bot supporte uniquement:`,
          `• Images 📸`,
          `• Vidéos 🎥`,
          `• Audio 🎵`,
          '',
          `🌊 _Water Hashira_`
        ].join('\n'), { quotedMessage: message });
      }

    } catch (error) {
      log.error('Failed to extract view once message:', error.message, error.stack);
      await this.sendSafeMessage(chatId, [
        `❌ *Erreur lors de l'extraction*`,
        '',
        `Impossible d'extraire le média vue unique.`,
        ``,
        `Raisons possibles:`,
        `• Le média a expiré`,
        `• Le message n'est pas une vue unique`,
        `• Erreur de connexion`,
        '',
        `🌊 _Water Hashira_`
      ].join('\n'), { quotedMessage: message });
    }
  }

  async cmdAntiBot(groupId, message, args) {
    const settings = this.getGroupSettings(groupId);
    const subCmd = args[0]?.toLowerCase();

    if (!subCmd || subCmd === 'status') {
      // Show current status
      const status = settings.antibot?.enabled ? '✅ Activé' : '❌ Désactivé';
      const statusMessage = [
        `*🤖 Configuration Anti-Bot*`,
        '',
        `📊 *Statut actuel:* ${status}`,
        '',
        `*💡 Commandes disponibles:*`,
        `• \`${CONFIG.prefix}antibot on\` - Activer`,
        `• \`${CONFIG.prefix}antibot off\` - Désactiver`,
        `• \`${CONFIG.prefix}antibot status\` - Voir le statut`,
        '',
        `*🛡️ Fonctionnement:*`,
        `Quand activé, le bot expulse automatiquement`,
        `tout autre bot ajouté au groupe.`,
        '',
        `⚠️ *Note:* Le bot doit être admin pour expulser`,
        '',
        `🌊 _Water Hashira - Protection Anti-Bot_`
      ].join('\n');

      await this.sendSafeMessage(groupId, statusMessage, { quotedMessage: message });
      return;
    }

    if (subCmd === 'on' || subCmd === 'enable' || subCmd === 'activer') {
      settings.antibot.enabled = true;
      this.saveGroupSettings();

      await this.sock.sendMessage(groupId, {
        text: [
          `✅ *Anti-Bot Activé!*`,
          '',
          `🤖 Le bot expulsera automatiquement`,
          `tout autre bot ajouté au groupe.`,
          '',
          `🛡️ *Protection active*`,
          `Seul ${CONFIG.botName || 'AbyssFlow'} est autorisé.`,
          '',
          `⚠️ *Important:* Le bot doit être admin`,
          `pour pouvoir expulser les autres bots.`,
          '',
          `🌊 _Water Hashira - Protection Activée_`
        ].join('\n'),
        quoted: message
      });

      log.info(`Anti-bot enabled in ${groupId}`);
    } else if (subCmd === 'off' || subCmd === 'disable' || subCmd === 'desactiver') {
      settings.antibot.enabled = false;
      this.saveGroupSettings();

      await this.sock.sendMessage(groupId, {
        text: [
          `❌ *Anti-Bot Désactivé*`,
          '',
          `🤖 Les autres bots peuvent maintenant`,
          `être ajoutés au groupe.`,
          '',
          `💡 Pour réactiver: \`${CONFIG.prefix}antibot on\``,
          '',
          `🌊 _Water Hashira_`
        ].join('\n'),
        quoted: message
      });

      log.info(`Anti-bot disabled in ${groupId}`);
    } else {
      await this.sendSafeMessage(groupId, [
        `❌ *Commande invalide!*`,
        '',
        `*💡 Utilisation:*`,
        `• \`${CONFIG.prefix}antibot on\` - Activer`,
        `• \`${CONFIG.prefix}antibot off\` - Désactiver`,
        `• \`${CONFIG.prefix}antibot status\` - Voir le statut`
      ].join('\n'), { quotedMessage: message });
    }
  }

  async cmdToSticker(chatId, message) {
    try {
      // Check if message has image/video or is replying to one
      const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const currentMessage = message.message;
      
      let mediaMessage = null;
      let mediaType = null;

      // Check current message first
      if (currentMessage?.imageMessage) {
        mediaMessage = currentMessage.imageMessage;
        mediaType = 'image';
      } else if (currentMessage?.videoMessage) {
        mediaMessage = currentMessage.videoMessage;
        mediaType = 'video';
      }
      // Then check quoted message
      else if (quotedMessage?.imageMessage) {
        mediaMessage = quotedMessage.imageMessage;
        mediaType = 'image';
      } else if (quotedMessage?.videoMessage) {
        mediaMessage = quotedMessage.videoMessage;
        mediaType = 'video';
      }

      if (!mediaMessage) {
        await this.sendSafeMessage(chatId, [
          `❌ *Aucune image/vidéo détectée!*`,
          '',
          `*💡 Utilisation:*`,
          `1. Envoyez une image/vidéo avec \`${CONFIG.prefix}sticker\``,
          `2. Ou répondez à une image/vidéo avec \`${CONFIG.prefix}sticker\``,
          '',
          `*Exemples:*`,
          `• \`${CONFIG.prefix}sticker\` - Convertir en sticker`,
          `• \`${CONFIG.prefix}s\` - Alias court`,
          '',
          `⚠️ *Note:* Vidéos limitées à 10 secondes`,
          '',
          `🌊 _Water Hashira - Convertisseur de Stickers_`
        ].join('\n'), { quotedMessage: message });
        return;
      }

      log.info(`Converting ${mediaType} to sticker in ${chatId}`);

      // Download the media
      const buffer = await downloadMediaMessage(
        quotedMessage ? { message: quotedMessage } : message,
        'buffer',
        {},
        { logger: log, reuploadRequest: this.sock.updateMediaMessage }
      );

      // Send as sticker
      await this.sock.sendMessage(chatId, {
        sticker: buffer,
        quoted: message
      });

      log.info(`Successfully converted ${mediaType} to sticker`);

    } catch (error) {
      log.error('Failed to convert to sticker:', error.message, error.stack);
      await this.sendSafeMessage(chatId, [
        `❌ *Erreur lors de la conversion*`,
        '',
        `Impossible de convertir en sticker.`,
        '',
        `Raisons possibles:`,
        `• Fichier trop volumineux`,
        `• Format non supporté`,
        `• Vidéo trop longue (max 10s)`,
        '',
        `🌊 _Water Hashira_`
      ].join('\n'), { quotedMessage: message });
    }
  }

  async cmdToImage(chatId, message) {
    try {
      // Check if message has sticker or is replying to one
      const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const currentMessage = message.message;
      
      let stickerMessage = null;

      // Check current message first
      if (currentMessage?.stickerMessage) {
        stickerMessage = currentMessage.stickerMessage;
      }
      // Then check quoted message
      else if (quotedMessage?.stickerMessage) {
        stickerMessage = quotedMessage.stickerMessage;
      }

      if (!stickerMessage) {
        await this.sendSafeMessage(chatId, [
          `❌ *Aucun sticker détecté!*`,
          '',
          `*💡 Utilisation:*`,
          `1. Envoyez un sticker avec \`${CONFIG.prefix}toimage\``,
          `2. Ou répondez à un sticker avec \`${CONFIG.prefix}toimage\``,
          '',
          `*Exemples:*`,
          `• \`${CONFIG.prefix}toimage\` - Convertir en image`,
          `• \`${CONFIG.prefix}toimg\` - Alias`,
          `• \`${CONFIG.prefix}topng\` - Alias`,
          '',
          `🌊 _Water Hashira - Convertisseur d'Images_`
        ].join('\n'), { quotedMessage: message });
        return;
      }

      log.info(`Converting sticker to image in ${chatId}`);

      // Download the sticker
      const buffer = await downloadMediaMessage(
        quotedMessage ? { message: quotedMessage } : message,
        'buffer',
        {},
        { logger: log, reuploadRequest: this.sock.updateMediaMessage }
      );

      // Send as image
      await this.sock.sendMessage(chatId, {
        image: buffer,
        caption: `📸 *Sticker Converti en Image*\n\n🌊 _Water Hashira_`,
        quoted: message
      });

      log.info('Successfully converted sticker to image');

    } catch (error) {
      log.error('Failed to convert to image:', error.message, error.stack);
      await this.sendSafeMessage(chatId, [
        `❌ *Erreur lors de la conversion*`,
        '',
        `Impossible de convertir en image.`,
        '',
        `Raisons possibles:`,
        `• Sticker animé non supporté`,
        `• Erreur de téléchargement`,
        `• Format corrompu`,
        '',
        `🌊 _Water Hashira_`
      ].join('\n'), { quotedMessage: message });
    }
  }

  extractText(message) {
    const msg = message.message;
    if (!msg) return '';

    if (msg.conversation) return msg.conversation.trim();
    if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text.trim();
    if (msg.imageMessage?.caption) return msg.imageMessage.caption.trim();
    if (msg.videoMessage?.caption) return msg.videoMessage.caption.trim();
    if (msg.buttonsResponseMessage?.selectedButtonId) return msg.buttonsResponseMessage.selectedButtonId.trim();
    if (msg.listResponseMessage?.singleSelectReply?.selectedRowId)
      return msg.listResponseMessage.singleSelectReply.selectedRowId.trim();

    return '';
  }

  formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, '0'))
      .join(':');
  }

  // Legal & Privacy Commands
  async cmdPrivacy(chatId, message) {
    const privacyText = [
      `🔒 *POLITIQUE DE CONFIDENTIALITÉ*`,
      ``,
      `📅 *Dernière mise à jour:* ${new Date().toLocaleDateString('fr-FR')}`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `*1️⃣ COLLECTE DE DONNÉES*`,
      ``,
      `Le bot collecte et stocke temporairement:`,
      `• Identifiants WhatsApp (JID)`,
      `• Messages texte (cache temporaire)`,
      `• Médias partagés (cache temporaire)`,
      `• Métadonnées des groupes`,
      `• Paramètres de configuration`,
      ``,
      `*2️⃣ UTILISATION DES DONNÉES*`,
      ``,
      `Les données sont utilisées pour:`,
      `• Fournir les fonctionnalités du bot`,
      `• Détecter les modifications/suppressions`,
      `• Gérer les permissions (owners/admins)`,
      `• Améliorer l'expérience utilisateur`,
      ``,
      `*3️⃣ STOCKAGE*`,
      ``,
      `📦 *Cache Messages:* Max 1000 messages`,
      `⏱️ *Durée:* Temporaire (RAM uniquement)`,
      `🗑️ *Suppression:* Automatique au redémarrage`,
      `💾 *Données persistantes:* Paramètres groupes uniquement`,
      ``,
      `*4️⃣ PARTAGE DE DONNÉES*`,
      ``,
      `❌ Nous NE partageons PAS vos données avec:`,
      `• Des tiers`,
      `• Des annonceurs`,
      `• Des services externes`,
      ``,
      `✅ Accès limité aux:`,
      `• Propriétaires du bot (owners)`,
      `• Système de surveillance automatique`,
      ``,
      `*5️⃣ SÉCURITÉ*`,
      ``,
      `🔐 Mesures de sécurité:`,
      `• Authentification multi-owner`,
      `• Rate limiting anti-spam`,
      `• Vérification des permissions`,
      `• Logs sécurisés`,
      ``,
      `*6️⃣ VOS DROITS*`,
      ``,
      `Vous avez le droit de:`,
      `• Demander la suppression de vos données`,
      `• Quitter les groupes avec le bot`,
      `• Bloquer le bot`,
      `• Demander des informations sur vos données`,
      ``,
      `*7️⃣ SURVEILLANCE AUTOMATIQUE*`,
      ``,
      `⚠️ Le bot surveille automatiquement:`,
      `• Messages modifiés`,
      `• Messages supprimés`,
      `• Médias supprimés`,
      ``,
      `Ces données sont affichées publiquement dans le groupe.`,
      ``,
      `*8️⃣ CONTACT*`,
      ``,
      `📧 Email: ${process.env.CONTACT_EMAIL || 'contact@almight.tech'}`,
      `🌐 Portfolio: ${process.env.CREATOR_PORTFOLIO || 'https://almightportfolio.vercel.app/'}`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `💡 *Tapez ${CONFIG.prefix}disclaimer pour l'avertissement légal*`,
      `💡 *Tapez ${CONFIG.prefix}terms pour les conditions*`,
      ``,
      `🌊 _AbyssFlow Bot - Water Hashira_`
    ].join('\n');

    await this.sendSafeMessage(chatId, privacyText, { quotedMessage: message });
  }

  async cmdDisclaimer(chatId, message) {
    const disclaimerText = [
      `⚠️ *AVERTISSEMENT LÉGAL (DISCLAIMER)*`,
      ``,
      `📅 *Dernière mise à jour:* ${new Date().toLocaleDateString('fr-FR')}`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `*1️⃣ UTILISATION À VOS RISQUES*`,
      ``,
      `Ce bot est fourni "TEL QUEL" sans garantie d'aucune sorte.`,
      `L'utilisation du bot se fait à vos propres risques.`,
      ``,
      `*2️⃣ AUCUNE GARANTIE*`,
      ``,
      `Nous ne garantissons PAS:`,
      `❌ La disponibilité continue du service`,
      `❌ L'absence de bugs ou d'erreurs`,
      `❌ La compatibilité avec toutes les versions WhatsApp`,
      `❌ La récupération de tous les messages supprimés`,
      ``,
      `*3️⃣ RESPONSABILITÉ LIMITÉE*`,
      ``,
      `Les créateurs et propriétaires du bot ne sont PAS responsables:`,
      `• Des dommages directs ou indirects`,
      `• De la perte de données`,
      `• Des interruptions de service`,
      `• Des actions des utilisateurs du bot`,
      `• Des conflits dans les groupes`,
      ``,
      `*4️⃣ CONFORMITÉ WHATSAPP*`,
      ``,
      `⚠️ *IMPORTANT:*`,
      `• Ce bot utilise WhatsApp de manière non officielle`,
      `• WhatsApp peut bloquer les comptes utilisant des bots`,
      `• Utilisez un numéro secondaire recommandé`,
      `• Nous ne sommes pas affiliés à WhatsApp/Meta`,
      ``,
      `*5️⃣ SURVEILLANCE AUTOMATIQUE*`,
      ``,
      `🔍 Le bot surveille et expose publiquement:`,
      `• Les messages modifiés`,
      `• Les messages supprimés`,
      `• Les médias supprimés`,
      ``,
      `⚠️ Cela peut créer des tensions dans les groupes.`,
      `En utilisant ce bot, vous acceptez cette fonctionnalité.`,
      ``,
      `*6️⃣ CONTENU UTILISATEUR*`,
      ``,
      `Nous ne sommes PAS responsables:`,
      `• Du contenu partagé par les utilisateurs`,
      `• Des messages offensants ou illégaux`,
      `• Des violations de droits d'auteur`,
      `• Des conflits entre utilisateurs`,
      ``,
      `*7️⃣ MODIFICATIONS*`,
      ``,
      `Nous nous réservons le droit de:`,
      `• Modifier le bot à tout moment`,
      `• Arrêter le service sans préavis`,
      `• Bloquer des utilisateurs`,
      `• Quitter des groupes`,
      ``,
      `*8️⃣ JURIDICTION*`,
      ``,
      `🌍 Ce bot est hébergé au: *Cameroun*`,
      `⚖️ Lois applicables: Lois camerounaises`,
      ``,
      `*9️⃣ ACCEPTATION*`,
      ``,
      `En utilisant ce bot, vous acceptez:`,
      `✅ Cette clause de non-responsabilité`,
      `✅ La politique de confidentialité`,
      `✅ Les conditions d'utilisation`,
      `✅ Les risques associés`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `💡 *Tapez ${CONFIG.prefix}privacy pour la politique de confidentialité*`,
      `💡 *Tapez ${CONFIG.prefix}terms pour les conditions*`,
      ``,
      `🌊 _AbyssFlow Bot - Water Hashira_`
    ].join('\n');

    await this.sendSafeMessage(chatId, disclaimerText, { quotedMessage: message });
  }

  async cmdTerms(chatId, message) {
    const termsText = [
      `📜 *CONDITIONS D'UTILISATION*`,
      ``,
      `📅 *Dernière mise à jour:* ${new Date().toLocaleDateString('fr-FR')}`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `*1️⃣ ACCEPTATION DES CONDITIONS*`,
      ``,
      `En utilisant AbyssFlow Bot, vous acceptez:`,
      `✅ Ces conditions d'utilisation`,
      `✅ La politique de confidentialité`,
      `✅ L'avertissement légal (disclaimer)`,
      ``,
      `❌ Si vous n'acceptez pas, n'utilisez pas le bot.`,
      ``,
      `*2️⃣ UTILISATION AUTORISÉE*`,
      ``,
      `✅ Vous POUVEZ:`,
      `• Utiliser le bot dans vos groupes`,
      `• Inviter le bot dans plusieurs groupes`,
      `• Utiliser toutes les commandes publiques`,
      `• Configurer les paramètres (si admin)`,
      ``,
      `❌ Vous NE POUVEZ PAS:`,
      `• Spammer les commandes`,
      `• Abuser des fonctionnalités`,
      `• Tenter de pirater le bot`,
      `• Utiliser le bot pour du harcèlement`,
      `• Violer les lois locales`,
      ``,
      `*3️⃣ COMMANDES RÉSERVÉES*`,
      ``,
      `👑 *Owners uniquement:*`,
      `• broadcast, stats, block, unblock`,
      `• join, leave`,
      ``,
      `🛡️ *Admins + Owners:*`,
      `• kick, add, promote, demote`,
      `• open, close, welcome, goodbye`,
      `• tagall`,
      ``,
      `👥 *Tous les utilisateurs:*`,
      `• help, ping, about, links`,
      `• github, whoami`,
      `• privacy, disclaimer, terms`,
      ``,
      `*4️⃣ SURVEILLANCE AUTOMATIQUE*`,
      ``,
      `🔍 *Fonctionnalité automatique:*`,
      `Le bot surveille et expose publiquement:`,
      `• Messages modifiés (avant/après)`,
      `• Messages supprimés (récupération)`,
      `• Médias supprimés (renvoi)`,
      ``,
      `⚠️ Cette fonctionnalité est TOUJOURS active.`,
      `Elle ne peut pas être désactivée.`,
      ``,
      `*5️⃣ COMPORTEMENT INTERDIT*`,
      ``,
      `🚫 Strictement interdit:`,
      `• Spam de commandes (>12/minute)`,
      `• Contenu illégal ou offensant`,
      `• Harcèlement d'autres utilisateurs`,
      `• Tentatives de contournement des limites`,
      `• Reverse engineering du bot`,
      ``,
      `*6️⃣ SANCTIONS*`,
      ``,
      `En cas de violation, nous pouvons:`,
      `⚠️ Bloquer votre numéro`,
      `⚠️ Faire quitter le bot de vos groupes`,
      `⚠️ Signaler aux autorités (si illégal)`,
      ``,
      `*7️⃣ DONNÉES ET CONFIDENTIALITÉ*`,
      ``,
      `📦 Le bot stocke temporairement:`,
      `• Messages (cache de 1000 max)`,
      `• Médias (temporaire)`,
      `• Paramètres de groupes`,
      ``,
      `🗑️ Suppression automatique au redémarrage.`,
      ``,
      `*8️⃣ DISPONIBILITÉ DU SERVICE*`,
      ``,
      `⚠️ Le bot peut être indisponible:`,
      `• Maintenance`,
      `• Mises à jour`,
      `• Problèmes techniques`,
      `• Décision des propriétaires`,
      ``,
      `Aucun remboursement (service gratuit).`,
      ``,
      `*9️⃣ MODIFICATIONS DES CONDITIONS*`,
      ``,
      `Nous pouvons modifier ces conditions à tout moment.`,
      `La date de mise à jour sera modifiée.`,
      `Continuer à utiliser le bot = acceptation des nouvelles conditions.`,
      ``,
      `*🔟 RÉSILIATION*`,
      ``,
      `Vous pouvez arrêter d'utiliser le bot à tout moment:`,
      `• Supprimez le bot du groupe`,
      `• Bloquez le numéro du bot`,
      `• Demandez au owner de quitter`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `*📞 CONTACT*`,
      ``,
      `📧 Email: ${process.env.CONTACT_EMAIL || 'contact@almight.tech'}`,
      `👤 Créateur: ${process.env.CREATOR_NAME || 'Josias Almight'}`,
      `🌐 Portfolio: ${process.env.CREATOR_PORTFOLIO || 'https://almightportfolio.vercel.app/'}`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `💡 *Tapez ${CONFIG.prefix}privacy pour la confidentialité*`,
      `💡 *Tapez ${CONFIG.prefix}disclaimer pour l'avertissement*`,
      ``,
      `🌊 _AbyssFlow Bot - Water Hashira_`
    ].join('\n');

    await this.sendSafeMessage(chatId, termsText, { quotedMessage: message });
  }

  // Owner Commands
  async cmdBroadcast(chatId, message, args) {
    try {
      if (args.length === 0) {
        await this.sendSafeMessage(chatId, [
          `❌ *Aucun message fourni!*`,
          ``,
          `*💡 Utilisation:*`,
          `\`${CONFIG.prefix}broadcast <message>\``,
          ``,
          `*Exemple:*`,
          `\`${CONFIG.prefix}broadcast Mise à jour importante!\``
        ].join('\n'));
        return;
      }

      const broadcastMessage = args.join(' ');
      const chats = await this.sock.groupFetchAllParticipating();
      const groups = Object.values(chats).filter(chat => chat.id.endsWith('@g.us'));

      await this.sendSafeMessage(chatId, `📢 Diffusion en cours vers ${groups.length} groupes...`);

      let successCount = 0;
      let failCount = 0;

      for (const group of groups) {
        try {
          await this.sock.sendMessage(group.id, {
            text: [
              `📢 *ANNONCE DU CRÉATEUR*`,
              ``,
              broadcastMessage,
              ``,
              `━━━━━━━━━━━━━━━━━━━━`,
              `🌊 _AbyssFlow Bot - Water Hashira_`
            ].join('\n')
          });
          successCount++;
          await sleep(2000); // Délai anti-spam
        } catch (error) {
          failCount++;
          log.error(`Broadcast failed for ${group.id}:`, error.message);
        }
      }

      await this.sendSafeMessage(chatId, [
        `✅ *Diffusion terminée!*`,
        ``,
        `📊 *Résultats:*`,
        `• Succès: ${successCount}`,
        `• Échecs: ${failCount}`,
        `• Total: ${groups.length}`
      ].join('\n'));

      log.info(`Broadcast completed: ${successCount}/${groups.length} successful`);
    } catch (error) {
      log.error('Broadcast error:', error.message);
      await this.sendSafeMessage(chatId, `❌ Erreur lors de la diffusion: ${error.message}`);
    }
  }

  async cmdStats(chatId, message) {
    try {
      const chats = await this.sock.groupFetchAllParticipating();
      const groups = Object.values(chats).filter(chat => chat.id.endsWith('@g.us'));
      
      const uptime = Date.now() - this.metrics.startedAt;
      const memoryUsage = process.memoryUsage();

      const statsText = [
        `📊 *STATISTIQUES DU BOT*`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `*⏱️ UPTIME*`,
        `• Démarré: ${new Date(this.metrics.startedAt).toLocaleString('fr-FR')}`,
        `• Durée: ${this.formatDuration(uptime)}`,
        ``,
        `*👥 GROUPES*`,
        `• Total: ${groups.length}`,
        `• Actifs: ${groups.filter(g => g.announce === false).length}`,
        ``,
        `*💬 MESSAGES*`,
        `• Cache actuel: ${this.messageCache.size}/${this.maxCacheSize}`,
        `• Commandes traitées: ${this.commandCount}`,
        ``,
        `*💾 MÉMOIRE*`,
        `• RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        `• Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        `• Heap Total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        ``,
        `*⚙️ SYSTÈME*`,
        `• Node.js: ${process.version}`,
        `• Platform: ${process.platform}`,
        `• Arch: ${process.arch}`,
        ``,
        `*👑 OWNERS*`,
        `• Total: ${CONFIG.owners.length}`,
        `• Liste: ${CONFIG.owners.join(', ')}`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `🌊 _AbyssFlow Bot - Water Hashira_`
      ].join('\n');

      await this.sendSafeMessage(chatId, statsText, { quotedMessage: message });
    } catch (error) {
      log.error('Stats error:', error.message);
      await this.sendSafeMessage(chatId, `❌ Erreur lors de la récupération des stats: ${error.message}`);
    }
  }

  async cmdBlock(chatId, message, args) {
    try {
      const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      
      if (mentionedJids.length === 0) {
        await this.sendSafeMessage(chatId, [
          `❌ *Aucun utilisateur mentionné!*`,
          ``,
          `*💡 Utilisation:*`,
          `\`${CONFIG.prefix}block @user\``
        ].join('\n'));
        return;
      }

      for (const jid of mentionedJids) {
        await this.sock.updateBlockStatus(jid, 'block');
      }

      await this.sendSafeMessage(chatId, [
        `🚫 *Utilisateur(s) bloqué(s)!*`,
        ``,
        `• Total: ${mentionedJids.length}`,
        ``,
        `🌊 _Water Hashira_`
      ].join('\n'), { mentions: mentionedJids });

      log.info(`Blocked ${mentionedJids.length} user(s)`);
    } catch (error) {
      log.error('Block error:', error.message);
      await this.sendSafeMessage(chatId, `❌ Erreur lors du blocage: ${error.message}`);
    }
  }

  async cmdUnblock(chatId, message, args) {
    try {
      const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      
      if (mentionedJids.length === 0) {
        await this.sendSafeMessage(chatId, [
          `❌ *Aucun utilisateur mentionné!*`,
          ``,
          `*💡 Utilisation:*`,
          `\`${CONFIG.prefix}unblock @user\``
        ].join('\n'));
        return;
      }

      for (const jid of mentionedJids) {
        await this.sock.updateBlockStatus(jid, 'unblock');
      }

      await this.sendSafeMessage(chatId, [
        `✅ *Utilisateur(s) débloqué(s)!*`,
        ``,
        `• Total: ${mentionedJids.length}`,
        ``,
        `🌊 _Water Hashira_`
      ].join('\n'), { mentions: mentionedJids });

      log.info(`Unblocked ${mentionedJids.length} user(s)`);
    } catch (error) {
      log.error('Unblock error:', error.message);
      await this.sendSafeMessage(chatId, `❌ Erreur lors du déblocage: ${error.message}`);
    }
  }

  async cmdJoin(chatId, message, args) {
    try {
      if (args.length === 0) {
        await this.sendSafeMessage(chatId, [
          `❌ *Aucun lien fourni!*`,
          ``,
          `*💡 Utilisation:*`,
          `\`${CONFIG.prefix}join <lien d'invitation>\``,
          ``,
          `*Exemple:*`,
          `\`${CONFIG.prefix}join https://chat.whatsapp.com/XXXXX\``
        ].join('\n'));
        return;
      }

      const inviteLink = args[0];
      const inviteCode = inviteLink.split('/').pop();

      await this.sock.groupAcceptInvite(inviteCode);

      await this.sendSafeMessage(chatId, [
        `✅ *Groupe rejoint avec succès!*`,
        ``,
        `🔗 Lien: ${inviteLink}`,
        ``,
        `🌊 _Water Hashira_`
      ].join('\n'));

      log.info(`Joined group via invite: ${inviteCode}`);
    } catch (error) {
      log.error('Join error:', error.message);
      await this.sendSafeMessage(chatId, `❌ Erreur lors de la tentative de rejoindre: ${error.message}`);
    }
  }

  async cmdLeave(chatId, message) {
    try {
      await this.sendSafeMessage(chatId, [
        `👋 *Au revoir!*`,
        ``,
        `Le bot quitte ce groupe sur demande du propriétaire.`,
        ``,
        `Merci d'avoir utilisé AbyssFlow Bot!`,
        ``,
        `🌊 _Water Hashira_`
      ].join('\n'));

      await sleep(2000);
      await this.sock.groupLeave(chatId);

      log.info(`Left group: ${chatId}`);
    } catch (error) {
      log.error('Leave error:', error.message);
      await this.sendSafeMessage(chatId, `❌ Erreur lors de la tentative de quitter: ${error.message}`);
    }
  }
}

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the bot
(async () => {
  try {
    const bot = new AbyssFlow();
    await bot.start();
    log.info('Bot started successfully');
    
    // Keep-alive mechanism for Railway/Heroku
    // Runs every 5 minutes to prevent the bot from sleeping
    cron.schedule('*/5 * * * *', () => {
      log.info('🔄 Keep-alive ping - Bot is active');
    });
    
    log.info('✅ Keep-alive mechanism activated');
  } catch (error) {
    log.error('Fatal error during startup:', error);
    process.exit(1);
  }
})();
