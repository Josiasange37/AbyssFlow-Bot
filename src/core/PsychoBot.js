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
const sharp = require('sharp');
const { CONFIG, THEMES, COLORS } = require('../config');
const pino = require('pino');
const { log, LOG_LEVEL_MAP, LOG_THRESHOLD } = require('../utils/logger');

// Create a filtered pino logger for Baileys
const baileysLogger = pino({ level: 'silent' });
const {
  sleep,
  normalizeNumber,
  simulateTyping,
  calculateTypingDuration,
  withTimeout
} = require('../utils/helpers');
const { connectDB } = require('../database');
const LinkHandler = require('../utils/LinkHandler');
const Brain = require('./Brain');
const useMongoAuthState = require('./mongoAuth');

// Constants used in class
const GITHUB_CACHE_TTL_MS = CONFIG.GITHUB_CACHE_TTL_MS;
const RATE_WINDOW_MS = CONFIG.RATE_WINDOW_MS;

class PsychoBot {
  constructor() {
    this.sock = null;
    this.commands = new Map();
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
    this.metadataCache = new Map(); // Cache for group participants

    if (!CONFIG.owners.length) {
      log.warn('No owners configured. Set BOT_OWNERS in .env');
    } else {
      log.info(`Owners: ${CONFIG.owners.join(', ')}`);
    }

    // Load available command plugins
    this.loadCommands();

    // Initialize Database (Async)
    connectDB().catch(e => log.error('DB Init Error:', e.message));
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
          message: 'yo @user bienvenu dans la famille xyberclan 🤝 installe toi bien'
        },
        goodbye: {
          enabled: false,
          message: 'ah @user nous a quitté... ciao l\'ami ✌️'
        },
        antibot: {
          enabled: false
        }
      };
      this.saveGroupSettings();
    }
    return this.groupSettings.groups[groupId];
  }

  async loadCommands() {
    const commandsDir = path.join(__dirname, '..', 'commands');
    try {
      if (!fs.existsSync(commandsDir)) return;

      const files = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));
      log.info(`Loading ${files.length} command plugins...`);

      // Clear existing commands to avoid duplicates/orphaned aliases on reload
      this.commands.clear();

      for (const file of files) {
        try {
          const commandPath = path.join(commandsDir, file);
          delete require.cache[require.resolve(commandPath)];
          const cmd = require(commandPath);

          if (cmd.name && cmd.execute) {
            this.commands.set(cmd.name.toLowerCase(), cmd);
            if (cmd.aliases && Array.isArray(cmd.aliases)) {
              cmd.aliases.forEach(alias => this.commands.set(alias.toLowerCase(), cmd));
            }
          }
        } catch (err) {
          log.error(`Failed to load command from ${file}:`, err.message);
        }
      }
      log.info(`Successfully loaded ${this.commands.size} commands (including aliases)`);
    } catch (error) {
      log.error('Error scanning commands directory:', error.message);
    }
  }

  async start(pairingNumber = null) {
    try {
      // Force AI Brain Init
      if (Brain) {
        Brain.init().catch(err => log.error('Brain Init Error:', err.message));
      }

      let state, saveCreds;
      if (CONFIG.mongoUri) {
        log.info('Using MongoDB for session storage 🔌');
        const mongoAuth = await useMongoAuthState('psycho-bot');
        state = mongoAuth.state;
        saveCreds = mongoAuth.saveCreds;
      } else {
        log.warn('⚠️ MONGO_URI is not set in environment. Falling back to local files.');
        log.info('Using local file system for session storage 📁');
        await fs.ensureDir(path.resolve(CONFIG.sessionPath));
        ({ state, saveCreds } = await useMultiFileAuthState(CONFIG.sessionPath));
      }

      let version;
      try {
        ({ version } = await fetchLatestBaileysVersion());
      } catch (error) {
        log.warn(`Baileys version lookup failed: ${error.message}. Using fallback.`);
        version = { version: [2, 3000, 1015901307] }; // Fallback
      }

      this.sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: !pairingNumber, // Do not print QR if using pairing code
        browser: pairingNumber ? ['Chrome (Linux)', '', ''] : ['PsychoBot', 'Chrome', '1.0.0'],
        markOnlineOnConnect: false,
        syncFullHistory: false,
        generateHighQualityLinkPreview: false,
        connectTimeoutMs: 60_000,
        defaultQueryTimeoutMs: 40_000,
      });

      // Pairing Code Logic
      if (pairingNumber && !this.sock.authState.creds.registered) {
        log.info(`Requesting pairing code for: ${pairingNumber}`);
        setTimeout(async () => {
          try {
            const code = await this.sock.requestPairingCode(pairingNumber);
            console.log('\n\n######################################################');
            console.log(`#           CODE DE CONNEXION: ${code}           #`);
            console.log('######################################################\n\n');
          } catch (err) {
            log.error('Failed to request pairing code:', err.message);
          }
        }, 4000);
      }

      this.sock.ev.on('creds.update', saveCreds);
      this.sock.ev.on('connection.update', (update) => this.onConnection(update));
      this.sock.ev.on('messages.upsert', (payload) => this.onMessages(payload));
      this.sock.ev.on('messages.update', (updates) => this.onMessageUpdate(updates));
      this.sock.ev.on('group-participants.update', (update) => this.onGroupParticipantsUpdate(update));

      this.pendingReconnect = false;
      log.info('Socket initialized.');

      // Start lock heartbeat if connected to Mongo
      if (CONFIG.mongoUri) {
        this.startHeartbeat();
      }
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
      log.info('connexion en cours...');
      return;
    }

    if (connection === 'open') {
      this.reconnectDelay = CONFIG.reconnectBase;
      log.info('on est en ligne les gars!');
      return;
    }

    if (connection === 'close') {
      this.sock = null; // Important: Nullify to prevent usage while closed
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
            await this.sendSmartWelcomeMessage(groupId, participant);
          }
        } else if ((action === 'remove' || action === 'leave') && settings.goodbye.enabled) {
          await this.sendSmartGoodbyeMessage(groupId, participant);
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

          await this.sendMessage(groupId, {
            text: [
              `wsh un bot sauvage a pop 🤖`,
              '',
              `je vire @${participantJid.split('@')[0]} direct, on veut pas de ça ici.`,
              '',
              `désolé frérot c'est la zone no-bot ici ✌️`
            ].join('\n'),
            mentions: [participantJid]
          });

          log.info(`Bot ${participantJid} removed from ${groupId}`);
        } catch (removeError) {
          log.error(`Failed to remove bot ${participantJid}:`, removeError.message);

          // Notify admins if bot couldn't be removed
          await this.sendMessage(groupId, {
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

  async sendSmartWelcomeMessage(groupId, participant) {
    try {
      const groupMetadata = await this.sock.groupMetadata(groupId);
      const groupName = groupMetadata.subject;
      const groupDesc = groupMetadata.desc || 'Pas de description pour le moment.';

      const greetings = [
        `wsh @user bienvenu dans la team ✌️`,
        `oh @user vient d'arriver, faites de la place !`,
        `salut @user, pose tes valises 🧳`,
        `hey @user, on t'attendait !`,
        `bienvenu chez toi @user 🏠`
      ];

      const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

      const message = [
        randomGreeting.replace(/@user/g, `@${participant.split('@')[0]}`),
        ``,
        `📝 *Le Topo du Groupe:*`,
        `"${groupDesc}"`,
        ``,
        `amuse-toi bien !`
      ].join('\n');

      await sleep(1000);

      // Try to get group profile pic
      let ppUrl;
      try { ppUrl = await this.sock.profilePictureUrl(groupId, 'image'); } catch { }

      if (ppUrl) {
        await this.sendMessage(groupId, { image: { url: ppUrl }, caption: message, mentions: [participant] });
      } else {
        await this.sendMessage(groupId, { text: message, mentions: [participant] });
      }

      log.info(`Smart welcome sent to ${participant} in ${groupId}`);
    } catch (error) {
      log.error('Failed to send smart welcome:', error.message);
    }
  }

  async sendSmartGoodbyeMessage(groupId, participant) {
    try {
      const messages = [
        `ciao @user, on t'aimait bien... ou pas lol 🏃‍♂️`,
        `dommage @user nous a quitté, la mif est en deuil 🕯️`,
        `bye @user, reviens nous voir quand tu veux !`,
        `hop, @user s'est barré. un de moins ✌️`,
        `ciao bg @user, à plus dans l'bus !`
      ];

      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      const text = randomMsg.replace(/@user/g, `@${participant.split('@')[0]}`);

      await sleep(1000);

      await this.sendMessage(groupId, {
        text: text,
        mentions: [participant]
      });

      log.info(`Smart goodbye sent for ${participant} in ${groupId}`);
    } catch (error) {
      log.error('Failed to send smart goodbye:', error.message);
    }
  }

  /**
   * Prevents multiple instances from fighting for the same connection
   */
  async startHeartbeat() {
    if (!CONFIG.mongoUri) return;

    const Lock = require('../database/models/Lock');
    const os = require('os');

    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

    this.heartbeatInterval = setInterval(async () => {
      try {
        await Lock.findOneAndUpdate(
          { instanceId: 'primary' },
          {
            lastHeartbeat: new Date(),
            processId: process.pid,
            hostname: os.hostname()
          },
          { upsert: true }
        );
      } catch (err) {
        log.debug('Lock heartbeat failed:', err.message);
      }
    }, 60_000); // Update every minute
  }

  /**
   * Safe sendMessage wrapper that checks connection status
   */
  async sendMessage(jid, content, options = {}) {
    if (!this.sock) {
      log.warn(`Cannot send message to ${jid}: Socket not connected.`);
      return null;
    }
    try {
      return await this.sock.sendMessage(jid, content, options);
    } catch (error) {
      if (error?.message === 'Connection Closed') {
        log.warn(`Failed to send message to ${jid}: Connection Closed.`);
      } else {
        log.error(`SendMessage error for ${jid}:`, error.message);
      }
      return null;
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

      await this.sendMessage(chatId, {
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
        await this.sendMessage(chatId, {
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
        await this.sendMessage(chatId, {
          image: msg.imageMessage.url ? { url: msg.imageMessage.url } : msg.imageMessage,
          caption: `🗑️ *Image Supprimée*\n\n👤 *Par:* ${senderName}\n\n🌊 _Récupérée par le Water Hashira_`,
          mentions: [cachedMessage.sender]
        });
      } else if (msg.videoMessage) {
        mediaType = 'Vidéo';
        await this.sendMessage(chatId, {
          video: msg.videoMessage.url ? { url: msg.videoMessage.url } : msg.videoMessage,
          caption: `🗑️ *Vidéo Supprimée*\n\n👤 *Par:* ${senderName}\n\n🌊 _Récupérée par le Water Hashira_`,
          mentions: [cachedMessage.sender]
        });
      } else if (msg.stickerMessage) {
        mediaType = 'Sticker';
        await this.sendMessage(chatId, {
          sticker: msg.stickerMessage.url ? { url: msg.stickerMessage.url } : msg.stickerMessage
        });
        await this.sendMessage(chatId, {
          text: `🗑️ *Sticker Supprimé*\n\n👤 *Par:* ${senderName}\n\n🌊 _Récupéré par le Water Hashira_`,
          mentions: [cachedMessage.sender]
        });
      } else if (msg.audioMessage) {
        mediaType = 'Audio';
        await this.sendMessage(chatId, {
          audio: msg.audioMessage.url ? { url: msg.audioMessage.url } : msg.audioMessage,
          mimetype: msg.audioMessage.mimetype,
          mentions: [cachedMessage.sender]
        });
      } else if (msg.documentMessage) {
        mediaType = 'Document';
        await this.sendMessage(chatId, {
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
        await this.sendMessage(chatId, {
          text: `🗑️ *Media Supprimé*\n\n👤 *Par:* ${senderName}\n\n⚠️ Le média ne peut plus être récupéré (supprimé du serveur WhatsApp)\n\n🌊 _Water Hashira_`,
          mentions: [cachedMessage.sender]
        });
      } catch (fallbackError) {
        log.error('Failed to send fallback notification:', fallbackError.message);
      }
    }
  }

  async downloadMedia(mediaMessage, type = null) {
    try {
      // If type isn't provided, try to guess or use the message itself if it's a full object
      const messageType = type ? `${type}Message` : (Object.keys(mediaMessage)[0]?.includes('Message') ? Object.keys(mediaMessage)[0] : null);

      if (!messageType && !mediaMessage.url) {
        throw new Error('Could not determine media type');
      }

      const fakeMessage = {
        key: { id: 'fake-id' },
        message: type ? { [messageType]: mediaMessage } : mediaMessage
      };

      const buffer = await downloadMediaMessage(
        fakeMessage,
        'buffer',
        {},
        { logger: baileysLogger, reuploadRequest: this.sock?.updateMediaMessage }
      );
      return buffer;
    } catch (error) {
      log.error('Failed to download media:', error.message);
      throw error;
    }
  }

  extractTextFromUpdate(message) {
    if (!message) return '';

    // Deep extraction for edited messages
    // Baileys sometimes wraps edits in protocolMessage or editedMessage
    const msg = message.protocolMessage?.editedMessage ||
      message.editedMessage?.message ||
      message.editedMessage ||
      message;

    return msg.conversation ||
      msg.extendedTextMessage?.text ||
      msg.imageMessage?.caption ||
      msg.videoMessage?.caption ||
      msg.message?.conversation || // Fallback for nested message
      msg.message?.extendedTextMessage?.text ||
      '';
  }

  getContextInfo(msg) {
    if (!msg) return null;
    const types = ['extendedTextMessage', 'imageMessage', 'videoMessage', 'stickerMessage', 'documentMessage', 'audioMessage', 'contactMessage', 'locationMessage'];
    for (const type of types) {
      if (msg[type]?.contextInfo) return msg[type].contextInfo;
    }
    if (msg.viewOnceMessage?.message) return this.getContextInfo(msg.viewOnceMessage.message);
    if (msg.viewOnceMessageV2?.message) return this.getContextInfo(msg.viewOnceMessageV2.message);
    if (msg.ephemeralMessage?.message) return this.getContextInfo(msg.ephemeralMessage.message);
    return null;
  }

  async handleMessage(message) {
    if (!message?.message) return;
    const chatId = message.key.remoteJid;
    if (!chatId || chatId === 'status@broadcast') return;

    const text = this.extractText(message);
    const isPrefixed = text && text.startsWith(CONFIG.prefix);

    // Ignore itself UNLESS it's a command
    if (message.key.fromMe && !isPrefixed) return;

    const sender = message.key.participant || message.key.remoteJid;
    const isGroup = chatId.endsWith('@g.us');
    const isOwner = this.isOwner(sender);

    // Robust Context Extraction
    const contextInfo = this.getContextInfo(message.message);
    const myJid = this.sock.user?.id || '';
    const myNumber = normalizeNumber(myJid);
    const mentionedJids = contextInfo?.mentionedJid || [];

    // Trigger Logic
    const isTagMentioned = mentionedJids.some(jid => normalizeNumber(jid) === myNumber) ||
      (text && text.includes(`@${myNumber}`));

    const isReplyToBot = contextInfo?.participant && normalizeNumber(contextInfo.participant) === myNumber;

    const normalizedText = (text || '').toLowerCase();
    // Strict requirement: "bot" or "psycho" (to avoid false positives with owner name)
    const isNameMentioned = normalizedText.includes('bot') ||
      normalizedText.includes('psycho');

    const isDM = !isGroup;

    const isBotTriggered = isTagMentioned || isReplyToBot || isDM || (isGroup && isNameMentioned);

    // Link Detection (Auto-Banner & Video Download)
    const urlPattern = /https?:\/\/[^\s]+/;
    if (text && urlPattern.test(text) && !message.key.fromMe) {
      const linkStart = Date.now();
      const handled = await LinkHandler.handle(this, chatId, text, message);
      log.info(`🔗 Link handling took ${Date.now() - linkStart}ms`);
      if (handled) return;
    }

    // --- GLOBAL AWARENESS: Log every message into history (only if not fromMe and not triggered) ---
    if (Brain && text && !message.key.fromMe && !isBotTriggered) {
      const senderName = message.pushName || sender.split('@')[0];
      Brain.logMessage(chatId, senderName, text).catch(e => log.error('Logging Error:', e.message));
    }

    // A. Command Handling
    if (isPrefixed) {
      const commandLine = text.slice(CONFIG.prefix.length).trim();
      if (!commandLine) return;

      const isGroupAdmin = isGroup ? await this.isGroupAdmin(chatId, sender) : false;
      const canUseAdminCommands = isOwner || isGroupAdmin;

      if (LOG_THRESHOLD >= LOG_LEVEL_MAP.info) {
        log.info(`Cmd: ${commandLine.split(/\s+/)[0]} | ${sender} (Owner: ${isOwner})`);
      }

      // Exempt owner from rate limit
      if (!isOwner && !this.withinRateLimit(sender)) return;

      await this.handleCommand(chatId, message, commandLine, canUseAdminCommands, isOwner, isGroupAdmin, isGroup, sender);
      return;
    }

    // B. AI Processing
    if (isBotTriggered && Brain) {
      // Exempt owner from rate limit
      if (!isOwner && !this.withinRateLimit(sender)) return;

      if (LOG_THRESHOLD >= LOG_LEVEL_MAP.info && isGroup) {
        log.info(`[AI] Triggered in Group | From: ${sender} | Tag: ${isTagMentioned}, Reply: ${isReplyToBot}, Name: ${isNameMentioned}`);
      }

      // Media Extraction
      let media = null;
      const msg = message.message;
      const isMedia = !!(msg.imageMessage || msg.videoMessage || msg.stickerMessage || msg.audioMessage ||
        msg.viewOnceMessage?.message?.imageMessage ||
        msg.viewOnceMessageV2?.message?.imageMessage);

      if (isMedia) {
        try {
          const buffer = await downloadMediaMessage(message, 'buffer', {});
          const mimetype = msg.imageMessage?.mimetype || msg.videoMessage?.mimetype ||
            msg.audioMessage?.mimetype || 'image/jpeg';
          media = { buffer, mimetype };
        } catch (err) { log.error('Media download error:', err.message); }
      } else if (contextInfo?.quotedMessage) {
        const quoted = contextInfo.quotedMessage;
        const isQuotedMedia = !!(quoted.imageMessage || quoted.videoMessage || quoted.audioMessage);
        if (isQuotedMedia) {
          try {
            const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {});
            const mimetype = quoted.imageMessage?.mimetype || quoted.videoMessage?.mimetype ||
              quoted.audioMessage?.mimetype || 'image/jpeg';
            media = { buffer, mimetype };
          } catch (err) { log.error('Quoted media download error:', err.message); }
        }
      }

      const cleanText = text ? text.replace(/@[0-9]+/g, '').trim() : "";

      // Empty interaction feedback
      if (!cleanText && !media) {
        if (isTagMentioned) await this.sendMessage(chatId, { text: "Wesh ? Tu m'as appelé ? 🤙⚡ (Ajoute du texte pour que je réponde !)" }, { quoted: message });
        else if (isReplyToBot) await this.sendMessage(chatId, { text: "Je t'écoute le sang... 👂 Dis-moi un truc !" }, { quoted: message });
        return;
      }

      // --- AI CONTEXT ENHANCEMENT: Group Participants ---
      let participantsInfo = "";
      let participantsMap = new Map();
      if (isGroup) {
        try {
          // Use cached metadata if fresh (TTL: 5 minutes)
          const cached = this.metadataCache.get(chatId);
          let groupMetadata;
          if (cached && (Date.now() - cached.time < 5 * 60 * 1000)) {
            groupMetadata = cached.data;
          } else {
            groupMetadata = await this.sock.groupMetadata(chatId);
            this.metadataCache.set(chatId, { data: groupMetadata, time: Date.now() });
          }

          participantsInfo = "\nUTILISATEURS DANS LE GROUPE (Tagge-les avec @Nom s'ils t'insultent ou si tu veux leur parler) : \n";
          groupMetadata.participants.forEach(p => {
            const name = p.id.split('@')[0];
            participantsInfo += `@${name} `;
            participantsMap.set(name.toLowerCase(), p.id);
          });
        } catch (e) { log.debug('Failed to get group metadata for context'); }
      }

      const response = await Brain.process(cleanText + participantsInfo || "Analyse ce média.", chatId, media);
      if (response) {
        // --- POST-PROCESS MENTIONS: Convert @Name to actual mentions ---
        const mentionedJids = [];
        const finalResponse = response.replace(/@(\w+)/g, (match, name) => {
          const jid = participantsMap.get(name.toLowerCase());
          if (jid) {
            mentionedJids.push(jid);
            return match; // Keep the text as @Name
          }
          return match;
        });

        const typingDuration = calculateTypingDuration(finalResponse.length);
        await simulateTyping(this.sock, chatId, typingDuration);
        await this.sendMessage(chatId, {
          text: finalResponse,
          mentions: mentionedJids
        }, { quoted: message });
      }
      return;
    }
  }


  async handleCommand(chatId, message, commandLine, canUseAdminCommands, isOwner, isGroupAdmin, isGroup, sender) {
    const [command, ...args] = commandLine.split(/\s+/);
    const cmdName = command.toLowerCase();
    this.commandCount += 1;

    // Check if command exists in plugins
    const plugin = this.commands.get(cmdName);
    if (plugin) {
      try {
        // Basic permission checks
        if (plugin.isOwner && !isOwner) {
          return await this.sendSafeMessage(chatId, '❌ Cette commande est réservée aux propriétaires du bot!');
        }
        if (plugin.isAdmin && !canUseAdminCommands) {
          return await this.sendSafeMessage(chatId, '❌ Seuls le créateur et les admins peuvent utiliser cette commande!', { quotedMessage: message });
        }
        if (plugin.isGroupOnly && !isGroup) {
          return await this.sendSafeMessage(chatId, '❌ Cette commande fonctionne uniquement dans les groupes!', { quotedMessage: message });
        }

        await plugin.execute({
          sock: this.sock,
          chatId,
          message,
          args,
          isOwner,
          isAdmin: canUseAdminCommands,
          isGroupAdmin,
          isGroup,
          sender,
          bot: this,
          config: CONFIG
        });
        return;
      } catch (error) {
        log.error(`Error executing plugin command ${cmdName}:`, error.message);
        await this.sendSafeMessage(chatId, `Oups, erreur sur la commande ${cmdName} :/`);
        return;
      }
    }


    // If command wasn't found in plugins, it might be for the AI or an unknown command
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

    const { quotedMessage = null } = options;

    try {
      await this.sendMessage(jid, {
        text: text,
        mentions: options.mentions || []
      }, { quoted: quotedMessage });

    } catch (error) {
      log.error(`Failed to send message to ${jid}:`, error.message);
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









  extractText(message) {
    const msg = message.message;
    if (!msg) return '';

    // Handle nested messages (edited, viewOnce, ephemeral)
    const realMsg = msg.protocolMessage?.editedMessage ||
      msg.viewOnceMessage?.message ||
      msg.viewOnceMessageV2?.message ||
      msg.ephemeralMessage?.message ||
      msg;

    if (realMsg.conversation) return realMsg.conversation.trim();
    if (realMsg.extendedTextMessage?.text) return realMsg.extendedTextMessage.text.trim();
    if (realMsg.imageMessage?.caption) return realMsg.imageMessage.caption.trim();
    if (realMsg.videoMessage?.caption) return realMsg.videoMessage.caption.trim();
    if (realMsg.documentMessage?.caption) return realMsg.documentMessage.caption.trim();
    if (realMsg.buttonsResponseMessage?.selectedButtonId) return realMsg.buttonsResponseMessage.selectedButtonId.trim();
    if (realMsg.listResponseMessage?.singleSelectReply?.selectedRowId)
      return realMsg.listResponseMessage.singleSelectReply.selectedRowId.trim();

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


  // Owner Commands

}


module.exports = PsychoBot;
