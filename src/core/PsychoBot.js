const EventEmitter = require('events');
const { makeWASocket, useMultiFileAuthState, DisconnectReason, delay, downloadMediaMessage, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs-extra');
const cron = require('node-cron');
const axios = require('axios');
const sharp = require('sharp');
const { log, LOG_THRESHOLD, LOG_LEVEL_MAP } = require('../utils/logger');
const { normalizeNumber, calculateTypingDuration, simulateTyping } = require('../utils/helpers');
const LinkHandler = require('../utils/LinkHandler');
const { CONFIG } = require('../config');
const Brain = require('./Brain');
const Memory = require('./Memory');
const { connectDB } = require('../database');
const GroupSettings = require('../database/models/GroupSettings');
const UserStats = require('../database/models/UserStats');
const useMongoAuthState = require('./mongoAuth');
const qrcode = require('qrcode-terminal');

const baileysLogger = pino({ level: 'silent' });

class PsychoBot extends EventEmitter {
  constructor(sessionId = 'psycho-bot', options = {}) {
    super();
    this.sessionId = sessionId;
    // Prefix sessionId with DEPLOYMENT_ID if set to avoid database/session collisions
    this.fullSessionId = process.env.DEPLOYMENT_ID ? `${process.env.DEPLOYMENT_ID}_${this.sessionId}` : this.sessionId;

    this.botName = options.botName || CONFIG.botName || 'Psycho Bot';
    this.sock = null;
    this.status = 'INITIALIZING';
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
    this.groupsDataPath = path.join(process.cwd(), 'data', `groups_${this.sessionId}.json`);
    this.groupSettings = this.loadGroupSettings();

    // Message cache for tracking edits and deletions (max 1000 messages)
    this.messageCache = new Map();
    this.maxCacheSize = 1000;
    this.metadataCache = new Map(); // Cache for group participants
    this.dramaTracker = new Map(); // Track message spikes for drama detection
    this.cloakMode = false; // Phase 2: Stealth Cloaking

    if (!CONFIG.owners.length) {
      log.warn(`[${this.sessionId}] No owners configured.`);
    }

    this.loadCommands();
    // Use session-scoped DB connection if needed or share the global one
    connectDB().catch(e => log.error(`[${this.sessionId}] DB Init Error:`, e.message));
    this.startAutoStatus();
    this.startGhostCore();
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

  /**
   * Status Update Handler for STALKER (Phase 11)
   */
  async onPresenceUpdate(update) {
    const { id, presences } = update;
    if (!this.stalkerList || !this.stalkerList.has(id)) return;

    // The 'presences' object contains statuses for various platforms, find the newest
    const presenceData = Object.values(presences)[0];
    if (!presenceData) return;

    const status = presenceData.lastKnownPresence || presenceData.type;
    const alertText = `👁️ *STALKER ALERT:* @${id.split('@')[0]} est désormais *${status.toUpperCase()}*.`;

    // Find owner JID
    const ownerJid = CONFIG.owners[0] + '@s.whatsapp.net';
    await this.sock.sendMessage(ownerJid, { text: alertText, mentions: [id] });
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
        log.info(`[${this.sessionId}] Using MongoDB for session storage 🔌`);
        const mongoAuth = await useMongoAuthState(this.fullSessionId);
        state = mongoAuth.state;
        saveCreds = mongoAuth.saveCreds;
      } else {
        log.warn(`[${this.sessionId}] ⚠️ MONGO_URI is not set. Falling back to local files.`);
        const sessionFolder = path.join(CONFIG.sessionPath, this.fullSessionId);
        await fs.ensureDir(path.resolve(sessionFolder));
        ({ state, saveCreds } = await useMultiFileAuthState(sessionFolder));
      }

      let version;
      try {
        ({ version } = await fetchLatestBaileysVersion());
      } catch (error) {
        log.warn(`Baileys version lookup failed: ${error.message}. Using fallback.`);
        version = [2, 3000, 1015901307]; // Fallback
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
      this.sock.ev.on('connection.update', (update) => {
        this.status = update.connection?.toUpperCase() || this.status;
        this.emit('connection.update', update);
        this.onConnection(update);
      });
      this.sock.ev.on('messages.upsert', (payload) => this.onMessages(payload));
      this.sock.ev.on('messages.update', (updates) => this.onMessageUpdate(updates));
      this.sock.ev.on('group-participants.update', (update) => this.onGroupParticipantsUpdate(update));
      this.sock.ev.on('presence.update', (update) => this.onPresenceUpdate(update));


      this.pendingReconnect = false;
      log.info('Socket initialized.');

      // Start lock heartbeat if connected to Mongo
      // Start distributed heartbeat
      this.startHeartbeat();

      // Start Scheduled Greetings (5 AM & Midnight)
      this.startScheduledGreetings();

      return this.sock;
    } catch (error) {
      log.error('Startup error:', error.message);
      this.scheduleReconnect();
    }
  }

  onConnection(update = {}) {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      this.status = 'QR_READY';
      this.qrCode = qr;
      log.info(`[${this.sessionId}] QR code generated.`);
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'connecting') {
      this.status = 'CONNECTING';
      log.info(`[${this.sessionId}] connexion en cours...`);
      return;
    }

    if (connection === 'open') {
      this.status = 'CONNECTED';
      this.reconnectDelay = CONFIG.reconnectBase;
      log.info(`[${this.sessionId}] on est en ligne les gars!`);
      return;
    }

    if (connection === 'close') {
      this.status = 'OFFLINE';
      this.sock = null;
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

  async getGroupSettings(groupId) {
    try {
      let settings = await GroupSettings.findOne({ groupId });
      if (!settings) {
        settings = await GroupSettings.create({ groupId });
      }
      return settings;
    } catch (error) {
      log.error('Failed to get group settings:', error.message);
      return { welcome: true, antiDelete: true, autoMod: true, chatbot: true }; // Fallback
    }
  }

  async onGroupParticipantsUpdate(update) {
    try {
      const { id: groupId, participants, action } = update;

      if (!groupId || !participants || !participants.length) return;

      const Blacklist = require('../database/models/Blacklist');

      for (const participant of participants) {
        // --- BLACKHOLE: AUTOMATED INTERDICTION ---
        if (action === 'add') {
          const isBlacklisted = await Blacklist.findOne({ userId: participant });
          if (isBlacklisted) {
            log.warn(`🕳️ BLACKHOLE: Blacklisted user ${participant} tried to join ${groupId}. Purging...`);
            const isBotAdmin = await this.isBotGroupAdmin(groupId);
            if (isBotAdmin) {
              await this.sock.groupParticipantsUpdate(groupId, [participant], 'remove');
              await this.sendMessage(groupId, { text: `🕳️ *BLACKHOLE TRIGGERED:* La cible @${participant.split('@')[0]} est bannie de tous les secteurs AbyssFlow. \n\n*Raison:* ${isBlacklisted.reason}`, mentions: [participant] });
              continue; // Skip further processing for this user
            }
          }
        }

        // --- OVERRIDE: ADMIN ENFORCEMENT ---
        if (this.overrideGroups && this.overrideGroups.has(groupId) && !this.isOwner(participant)) {
          if (action === 'promote' || action === 'demote') {
            log.warn(`🦾 OVERRIDE: Unauthorized admin change detected for ${participant} in ${groupId}. Reverting...`);
            const isBotAdmin = await this.isBotGroupAdmin(groupId);
            if (isBotAdmin) {
              const reverseAction = action === 'promote' ? 'demote' : 'promote';
              await this.sock.groupParticipantsUpdate(groupId, [participant], reverseAction);
              await this.sendMessage(groupId, { text: `🦾 *OVERRIDE ACTIVÉ:* Action de privilège non autorisée pour @${participant.split('@')[0]} annulée.`, mentions: [participant] });
            }
          }
        }

        // Check for antibot when someone is added
        if (action === 'add') {
          // Check if antibot is enabled
          if (settings.antibot?.enabled) {
            await this.checkAndRemoveBot(groupId, participant);
          }

          // Automatic welcome message
          if (settings.welcome) {
            await this.sendSmartWelcomeMessage(groupId, participant);
          }
        } else if (action === 'remove' || action === 'leave') {
          // Automatic goodbye message
          if (settings.welcome) {
            await this.sendSmartGoodbyeMessage(groupId, participant);
          }
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

      // --- XYBER-ELITE WELCOME BANNER ---
      let welcomeBanner;
      try {
        // Get user PFP
        let userPpUrl;
        try { userPpUrl = await this.sock.profilePictureUrl(participant, 'image'); } catch { }

        if (userPpUrl) {
          const ppResponse = await axios.get(userPpUrl, { responseType: 'arraybuffer' });
          const ppBuffer = Buffer.from(ppResponse.data);

          // Create a nice banner using sharp
          const width = 800;
          const height = 400;

          const svgBanner = `
              <svg width="${width}" height="${height}">
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
                  </linearGradient>
                  <mask id="circleMask">
                    <circle cx="150" cy="200" r="100" fill="white" />
                  </mask>
                </defs>
                <rect width="100%" height="100%" fill="url(#grad)" />
                <circle cx="150" cy="200" r="105" fill="#e94560" />
                <text x="300" y="180" font-family="Arial" font-size="40" fill="#e94560" font-weight="bold">BIENVENUE MOLA !</text>
                <text x="300" y="240" font-family="Arial" font-size="30" fill="white">${groupName.substring(0, 25)}</text>
                <text x="300" y="290" font-family="Arial" font-size="20" fill="#aaa">@${participant.split('@')[0]}</text>
              </svg>`;

          const circlePp = await sharp(ppBuffer)
            .resize(200, 200)
            .composite([{
              input: Buffer.from('<svg><circle cx="100" cy="100" r="100" /></svg>'),
              blend: 'dest-in'
            }])
            .png()
            .toBuffer();

          welcomeBanner = await sharp(Buffer.from(svgBanner))
            .composite([{ input: circlePp, top: 100, left: 50 }])
            .png()
            .toBuffer();
        }
      } catch (err) {
        log.debug('Failed to generate welcome banner:', err.message);
      }

      const messageContent = {
        text: message,
        mentions: [participant]
      };

      if (welcomeBanner) {
        messageContent.image = welcomeBanner;
        messageContent.caption = message;
        delete messageContent.text;
      } else if (userPpUrl) {
        messageContent.image = { url: userPpUrl };
        messageContent.caption = message;
        delete messageContent.text;
      }

      await this.sendMessage(groupId, messageContent);

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
    if (!this.sock) return null;
    try {
      // --- GHOST PROTOCOL: Human-Like Presence (Phase 9) ---
      if (!this.cloakMode && !options.noDelay) {
        const delayTime = Math.floor(Math.random() * 1500) + 800; // 0.8s - 2.3s
        const status = content.audio ? 'recording' : 'composing';

        await this.sock.sendPresenceUpdate(status, jid);
        await delay(delayTime);
        await this.sock.sendPresenceUpdate('paused', jid);
      }

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

      // Extract valid sender
      const sender = message.key.participant || message.key.remoteJid;
      if (!sender) return;

      // --- MEMORY UPDATE ---
      try {
        const pushName = message.pushName || 'Inconnu';
        Memory.updateUser(sender, { name: pushName });
      } catch (e) { /* Ignore memory errors */ }

      // Ignore self and broadcast
      if (message.key.fromMe || sender === 'status@broadcast') return;

      // Store message data
      const cachedData = {
        id: messageId,
        chatId: chatId,
        sender: sender,
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
            const settings = await this.getGroupSettings(chatId);
            if (settings.antiDelete) {
              log.info(`Message deletion detected: ${messageId} in ${chatId}`);
              await this.notifyMessageDeletion(chatId, cachedMessage);
            }
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
          `⚡ _Psycho Bot a tout vu mola ! ⚔️_`
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
            `👀 *Tiens tiens, t'as essayé de cacher ça ?*`,
            '',
            `👤 *Utilisateur:* ${senderName}`,
            `📝 *Message:* "${cachedMessage.text}"`,
            '',
            `⚡ _Psycho Bot a tout vu mola ! ⚔️_`
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
    const userName = message.pushName || 'Inconnu';
    const isGroup = chatId.endsWith('@g.us');

    // --- GHOST PROTOCOL: Anti-Ban Mark-as-Read (Phase 9) ---
    if (!message.key.fromMe && !this.cloakMode) {
      await this.sock.readMessages([message.key]);
    }


    // --- SHADOW BAN: TOTAL GHOSTING (Phase 5) ---
    if (this.shadowBannedUsers && this.shadowBannedUsers.has(sender) && !this.isOwner(sender)) {
      return; // Complete ignorance
    }

    // --- BLACKOUT: Targeted Media Blockage (Phase 11) ---
    if (this.blackoutList && this.blackoutList.has(sender) && !this.isOwner(sender)) {
      const isMedia = message.message?.imageMessage || message.message?.videoMessage || message.message?.audioMessage || message.message?.documentMessage;
      if (isMedia) {
        (async () => {
          try {
            await this.sock.sendMessage(chatId, { delete: message.key });
            log.info(`🌑 BLACKOUT: Neutralized media from ${sender}`);
          } catch (e) { }
        })();
        return; // Stop processing
      }
    }

    // --- WATCHDOG: Global Surveillance Alert (Phase 10) ---

    if (this.watchdogList && this.watchdogList.has(sender) && !message.key.fromMe) {
      (async () => {
        const groupName = isGroup ? (await this.sock.groupMetadata(chatId)).subject : 'DM';
        const alertText = `👁️ *WATCHDOG ALERT:* @${sender.split('@')[0]} a été détecté dans *${groupName}*.\n\n📖 *Message:* ${text || '[Media]'}`;
        // Find owner JID
        const ownerJid = CONFIG.owners[0] + '@s.whatsapp.net';
        await this.sock.sendMessage(ownerJid, { text: alertText, mentions: [sender] });
      })();
    }


    // --- DRAMA DETECTOR (Popcorn Mode) ---
    if (isGroup && !message.key.fromMe) {
      const now = Date.now();
      let tracker = this.dramaTracker.get(chatId) || { count: 0, lastTime: now, cooldown: 0 };

      // Reset if too much time passed (5s window for better burst detection)
      if (now - tracker.lastTime > 5000) {
        tracker.count = 0;
      }

      tracker.count++;
      tracker.lastTime = now;

      // Trigger if > 8 msg in 5 sec (Burst) AND not in cooldown
      if (tracker.count > 8 && now > tracker.cooldown) {
        log.info(`🎭 INTELLIGENT MEDIATION TRIGGERED in ${chatId}`);

        // Asynchronous Intelligent Intervention
        (async () => {
          try {
            const history = await Brain.getHistory(chatId);
            if (history.length < 5) return;

            const conversationContext = history.filter(m => m.role === 'user').slice(-10).map(m => m.text).join('\n');
            const mediationPrompt = `[DRAMA DETECTOR - ANALYSE D'AMBIANCE]
            Il y a une forte explosion de messages dans ce groupe. Analyse l'ambiance des 10 derniers messages ci-dessous.
            - Si c'est du drama ou une dispute : Interviens avec calme, sagesse et une touche d'humour pour calmer les tensions.
            - Si c'est juste du spam ou de la joie : Réagis avec un emoji cool ou une petite phrase d'encouragement.
            - Si c'est une discussion intense mais saine : Fais un mini résumé (1 ligne) pour aider ceux qui débarquent.
            
            HISTORIQUE RÉCENT :
            ${conversationContext}`;

            const intervention = await Brain.process(mediationPrompt, chatId, null, "Médiateur du Clan");
            if (intervention) {
              const cleanInt = intervention.replace(/\[MEMORY: .*?\]/g, '').trim();
              await this.sendMessage(chatId, { text: `🎭 *MÉDIATEUR D'ALLIANCE* 🤖\n\n${cleanInt}` });
            }
          } catch (err) { log.error('Mediation failed:', err.message); }
        })();

        tracker.cooldown = now + 120_000; // 2 min cooldown for mediation
        tracker.count = 0;
      }
      this.dramaTracker.set(chatId, tracker);
    }

    // --- SELECTIVE MUTE: Enforcement ---
    if (isGroup && this.mutedUsers && this.mutedUsers.has(chatId)) {
      const mutedList = this.mutedUsers.get(chatId);
      if (mutedList.has(sender) && !message.key.fromMe) {
        log.info(`Muted user ${sender} tried to talk in ${chatId}. Deleting...`);
        await this.sock.sendMessage(chatId, {
          delete: message.key
        });
        return;
      }
    }

    // --- PARALYZE: Social Vacuum (Phase 4/5) ---
    if (this.paralyzedUsers && this.paralyzedUsers.has(chatId)) {
      const paralyzedList = this.paralyzedUsers.get(chatId);
      if (paralyzedList.has(sender) && !message.key.fromMe) {
        log.info(`Paralyzed user ${sender} sent message in ${chatId}. Redacting...`);
        await this.sock.sendMessage(chatId, {
          edit: message.key,
          text: '🔇 [ CONTENU NEUTRALISÉ PAR LE CLAN ABYSSFLOW ]'
        });
        return;
      }
    }

    // --- VEX: Automated Harassment (Phase 4/5) ---
    if (this.vexedUsers && this.vexedUsers.has(chatId)) {
      const vexedList = this.vexedUsers.get(chatId);
      if (vexedList.has(sender) && !message.key.fromMe && !text?.startsWith(CONFIG.prefix)) {
        log.info(`Vexed user ${sender} sent message in ${chatId}. Triggering AI Roast...`);
        (async () => {
          const roast = await Brain.process(`[VEX PROTOCOL] L'utilisateur @${sender.split('@')[0]} a encore parlé. Fais lui un roast technique ultra humiliant car il est dans la blacklist.`, chatId, null, "Auditeur");
          if (roast) {
            await this.sendMessage(chatId, { text: `💀 *HUMILIATION PROTOCOLAIRE* 💀\n\n${roast}`, mentions: [sender] }, { quoted: message });
          }
        })();
      }
    }


    const isOwner = this.isOwner(sender);

    // Robust Context Extraction
    const contextInfo = this.getContextInfo(message.message);
    // Robust ID fetching (User ID or Creds ID)
    const myJid = this.sock.user?.id || this.sock.authState.creds.me?.id || '';
    const myNumber = normalizeNumber(myJid);
    const mentionedJids = contextInfo?.mentionedJid || [];
    const normalizedText = (text || '').toLowerCase();

    // Trigger Logic: Broad Match to fix "Empty Mention List" bugs
    // Checks: 1. Is JID in mention list? 2. Is Number in text (@237...)? 3. Is raw ID (without domain) in text?
    const isTagMentioned = mentionedJids.some(jid => normalizeNumber(jid) === myNumber) ||
      (text && (text.includes(`@${myNumber}`) || text.includes(`@${myJid.split('@')[0]}`)));

    // Enhanced Reply Check
    let isReplyToBot = false;
    if (contextInfo?.participant) {
      const quotedSender = normalizeNumber(contextInfo.participant);
      isReplyToBot = (quotedSender === myNumber);
    }


    // Strict requirement: "bot" or "psycho" (to avoid false positives with owner name)
    const isNameMentioned = normalizedText.includes('bot') ||
      normalizedText.includes('psycho');

    const isDM = !isGroup;

    const isBotTriggered = isTagMentioned || isReplyToBot || isDM || (isGroup && isNameMentioned);

    // --- DM SHIELD: QUARANTINE PROTOCOL (Phase 5) ---
    if (isDM && this.dmShield && !isOwner && !message.key.fromMe) {
      const scamPatterns = [/wa\.me\/settings/i, /free-robux/i, /bit\.ly/i, /gift-card/i, /tinyurl/i];
      if (text && scamPatterns.some(p => p.test(text))) {
        log.warn(`🛡️ QUARANTINE: Scam link detected in DM from ${sender}. Blocking...`);
        await this.sendMessage(sender, { text: '🛡️ *QUARANTINE PROTOCOL TRIGGERED:* Votre comportement est jugé hostile. Accès révoqué.' });
        await this.sock.updateBlockStatus(sender, 'block');
        return;
      }
    }

    // Link Detection (Auto-Banner & Video Download)
    const urlPattern = /https?:\/\/[^\s]+/;
    if (text && urlPattern.test(text) && !message.key.fromMe) {
      const linkStart = Date.now();
      const handled = await LinkHandler.handle(this, chatId, text, message);
      log.info(`🔗 Link handling took ${Date.now() - linkStart}ms`);
      if (handled) return;
    }

    const isGroupAdmin = isGroup ? await this.isGroupAdmin(chatId, sender) : false;
    const settings = isGroup ? await this.getGroupSettings(chatId) : null;

    // --- AUTO MODÉRATION 2.0: Check for spam/scams ---
    if (isGroup && settings?.autoMod && !isOwner && !isGroupAdmin) {
      const isSafe = await this.checkAutoMod(chatId, sender, text, message);
      if (!isSafe) return; // Stop processing if message was handled/deleted
    }

    // --- XP & LEVELING: Track group activity ---
    if (isGroup && !message.key.fromMe) {
      this.updateUserStats(chatId, sender).catch(e => log.error('XP Error:', e.message));
    }

    // --- GLOBAL AWARENESS: Log every message into history ---
    if (Brain && text && !message.key.fromMe && !isBotTriggered) {
      const senderName = message.pushName || sender.split('@')[0];
      Brain.logMessage(chatId, senderName, text).catch(e => log.error('Logging Error:', e.message));
    }

    // A. Command Handling
    if (isPrefixed) {
      const commandLine = text.slice(CONFIG.prefix.length).trim();
      if (!commandLine) return;

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
      // Check if chatbot is enabled for this group
      if (isGroup && settings && !settings.chatbot) return;
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

      // Context Extraction from Quoted Message
      let contextText = "";
      if (contextInfo?.quotedMessage) {
        const q = contextInfo.quotedMessage;
        const qText = q.conversation || q.extendedTextMessage?.text || "";
        if (qText) contextText = `\n\n[CONTEXTE - RÉPONSE À]: "${qText}"`;
      }

      const cleanText = (text ? text.replace(/@[0-9]+/g, '').trim() : "") + contextText;

      // Get unique commands with descriptions for AI mastery
      const uniqueCommands = Array.from(new Set(this.commands.values()));
      const availableCommands = uniqueCommands.map(c => `- ${c.name}: ${c.description || 'Pas de description'}`).join('\n');

      // Empty interaction feedback
      if (!cleanText && !media) {
        if (isTagMentioned) await this.sendMessage(chatId, { text: "Besoin d'aide ? Je suis à ton écoute. 🤙⚡" }, { quoted: message });
        else if (isReplyToBot) await this.sendMessage(chatId, { text: "Je t'écoute. Dis-moi un truc !" }, { quoted: message });
        return;
      }

      // --- AI CONTEXT ENHANCEMENT: Group Participants ---
      // Immediate feedback: Show typing status while processing
      if (!this.cloakMode) await this.sock.sendPresenceUpdate('composing', chatId);

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

          participantsInfo = "\n\n[SYSTEM_INFO - MEMBRES DU GROUPE (Référence uniquement, ce ne sont PAS des mentions actives)]:\n";
          groupMetadata.participants.forEach(p => {
            const name = p.id.split('@')[0];
            participantsInfo += `- ${name}\n`; // Use list format without @ to avoid confusion
            participantsMap.set(name.toLowerCase(), p.id);
          });
        } catch (e) { log.debug('Failed to get group metadata for context'); }
      }

      // Pass userName and availableCommands to Brain for Agentic Logic
      let response = await Brain.process(cleanText + participantsInfo || "Analyse ce média.", chatId, media, userName, availableCommands);

      if (response) {
        // --- AGENTIC EXECUTION PROTOCOL ---
        if (response.includes('[EXEC:')) {
          const execMatch = response.match(/\[EXEC: (.*?)\]/);
          if (execMatch && execMatch[1]) {
            const execStr = execMatch[1];
            const [cmdName, ...cmdArgs] = execStr.split(' ');

            // SECURITY CHECK: Only allow if sender is Owner or Admin
            // We need to fetch basic info again or assume passed 'canUseAdminCommands' is not available here.
            // Re-calculating safety
            const isGroup = chatId.endsWith('@g.us');
            let isAuthorized = CONFIG.owners.includes(sender.replace('@s.whatsapp.net', ''));

            if (!isAuthorized && isGroup) {
              try {
                const metadata = await this.sock.groupMetadata(chatId);
                const participant = metadata.participants.find(p => p.id === sender);
                isAuthorized = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
              } catch (e) { }
            }

            if (isAuthorized) {
              log.info(`🤖 AGENTIC EXECUTION: ${cmdName} by ${sender}`);
              const plugin = this.commands.get(cmdName.toLowerCase());
              if (plugin) {
                try {
                  // PASS OBJECT TO MATCH STANDARD COMMAND SIGNATURE
                  await plugin.execute({
                    sock: this.sock,
                    chatId,
                    message,
                    args: cmdArgs,
                    isOwner: CONFIG.owners.includes(sender.replace('@s.whatsapp.net', '')),
                    isAdmin: isAuthorized,
                    isGroupAdmin: isAuthorized, // simplification for autonomous execution
                    isGroup,
                    sender,
                    bot: this,
                    config: CONFIG
                  });
                  // Remove tag from response
                  response = response.replace(/\[EXEC: .*?\]/, '').trim();
                } catch (execErr) {
                  log.error(`Agentic execution error: ${execErr.message}`);
                  response += `\n(⚠️ Echec de l'agent: ${execErr.message})`;
                }
              }
            } else {
              response = response.replace(/\[EXEC: .*?\]/, '').trim();
            }
          }
        }

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

        // --- NATIVE IMAGE DELIVERY ---
        if (finalResponse.startsWith('[IMAGE]')) {
          const imageUrl = finalResponse.replace('[IMAGE]', '').trim();
          if (!this.cloakMode) await simulateTyping(this.sock, chatId, 1000);
          await this.sendMessage(chatId, {
            image: { url: imageUrl },
            caption: "✨ Voici ton image générée par Psycho Bot :"
          }, { quoted: message });
          return;
        }

        // Detect mentions in AI response (basic check) or default to sender
        const responseMentions = [sender, ...mentionedJids];

        if (!this.cloakMode) {
          const typingDuration = calculateTypingDuration(finalResponse.length);
          await simulateTyping(this.sock, chatId, typingDuration);
        }
        await this.sendMessage(chatId, {
          text: finalResponse,
          mentions: responseMentions
        }, { quoted: message });
      }
      return;
    }
  }


  async handleCommand(chatId, message, commandLine, canUseAdminCommands, isOwner, isGroupAdmin, isGroup, sender) {
    const [command, ...args] = commandLine.split(/\s+/);
    const cmdName = command.toLowerCase();

    // --- LOCK Protocol (Phase 8) ---
    if (this.lockedChats && this.lockedChats.has(chatId) && !isOwner) {
      if (cmdName !== 'lock') return; // Silent ignore when locked
    }

    this.commandCount += 1;

    // --- GHOST PROTOCOL: Anti-Spam Burst Protection (Phase 9) ---
    if (!isOwner) {
      if (!this.commandBurst) this.commandBurst = new Map();
      const burst = this.commandBurst.get(sender) || { count: 0, last: Date.now() };
      const now = Date.now();

      if (now - burst.last < 2000) {
        burst.count++;
      } else {
        burst.count = 0;
      }
      burst.last = now;
      this.commandBurst.set(sender, burst);

      if (burst.count > 3) {
        log.warn(`🚫 BURST PROTECTION: Ignoring spam from ${sender}`);
        return;
      }
    }


    // --- HONEYPOT TRAP DETECTION ---
    if (this.activeTraps && this.activeTraps.has(CONFIG.prefix + cmdName)) {
      log.warn(`🍯 HONEYPOT: Bot trap triggered by ${sender} in ${chatId}`);
      await this.neutralizeThreat(chatId, sender, message, "Automated Bot Probe (Honeypot Trap)");
      return;
    }

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
  }

  // If command wasn't found in plugins, it might be for the AI or an unknown command



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

  async updateUserStats(groupId, userId) {
    try {
      const xpToGain = Math.floor(Math.random() * 11) + 10; // 10-20 XP

      let stats = await UserStats.findOne({ userId, groupId });

      if (!stats) {
        stats = new UserStats({ userId, groupId });
      }

      // 1 minute cooldown for XP gain (not message count)
      const now = Date.now();
      const lastMessage = new Date(stats.lastMessageAt).getTime();

      stats.messagesCount += 1;

      if (now - lastMessage > 60000) {
        stats.xp += xpToGain;
        stats.lastMessageAt = now;

        // Level up logic (Simple: lvl * 100 XP required)
        const xpNeeded = stats.level * 100;
        if (stats.xp >= xpNeeded) {
          stats.level += 1;
          stats.xp = 0; // Reset or keep overflow

          // Notify level up with Psycho flow
          const userTag = `@${userId.split('@')[0]}`;
          await this.sendMessage(groupId, {
            text: `🔥 *LEVEL UP !* 🔥\n\nBravo ${userTag}, tu passes au *Niveau ${stats.level}* ! 🚀\nTon flow devient puissant mola. 🤙⚔️⚡`,
            mentions: [userId]
          });
        }
      }

      await stats.save();
    } catch (error) {
      log.error('Failed to update user stats:', error.message);
    }
  }

  async checkAutoMod(chatId, sender, text, message) {
    if (!text && !message.message?.contactMessage && !message.message?.contactsArrayMessage) return true;

    const isOwner = this.isOwner(sender);
    const isGroupAdmin = await this.isGroupAdmin(chatId, sender);
    if (isOwner || isGroupAdmin) return true;

    // --- SHIELD: ANTI-CRASH & EXPLOIT ENGINE ---

    // 1. Binarios / Crash Strings Detection
    // Detection of repetitive non-latin/symbol sequences often used in "travas"
    const binaryPattern = /[\u0000-\u001F\u007F-\u009F\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]{100,}/;
    const extremeRepetition = /(.)\1{500,}/; // Same character repeated 500+ times

    if (text && (binaryPattern.test(text) || extremeRepetition.test(text) || text.length > 15000)) {
      log.warn(`🛡️ SHIELD: Crash code detected from ${sender} in ${chatId}`);
      await this.neutralizeThreat(chatId, sender, message, "Crash Code / Binario");
      return false;
    }

    // 2. Malicious Links / Freeze Links
    const freezeLinks = [
      /wa\.me\/settings/i,
      /wa\.me\/qr/i,
      /chat\.whatsapp\.com\/invite\/[a-zA-Z0-0]{50,}/, // Malformed long invite
    ];

    if (text && freezeLinks.some(p => p.test(text))) {
      log.warn(`🛡️ SHIELD: Freeze link detected from ${sender} in ${chatId}`);
      await this.neutralizeThreat(chatId, sender, message, "Freeze Link Exploit");
      return false;
    }

    // 3. VCard / Contact Spam (Crash method)
    if (message.message?.contactMessage || message.message?.contactsArrayMessage) {
      const vcard = message.message?.contactMessage?.vcard || "";
      if (vcard.length > 5000 || (message.message?.contactsArrayMessage?.contacts?.length > 10)) {
        log.warn(`🛡️ SHIELD: VCard Spam detected from ${sender} in ${chatId}`);
        await this.neutralizeThreat(chatId, sender, message, "VCard/Contact Crash Exploit");
        return false;
      }
    }

    // 4. Standard Scam detection (Original logic)
    const scamPatterns = [/free-robux/i, /gift-card/i, /crypto-giveaway/i];
    if (text && scamPatterns.some(p => p.test(text))) {
      try {
        await this.sock.sendMessage(chatId, { delete: message.key });
        await this.addWarning(chatId, sender, "Lien suspect/Scam détecté");
        log.info(`Auto-Mod: Deleted scam message from ${sender} in ${chatId}`);
        return false;
      } catch (e) { log.debug('Failed to delete scam message:', e.message); }
    }

    // 5. Anti-Bot / Unauthorized Automated Entity Detection
    const botPrefixes = ['.', '!', '/', '#'];
    if (text && botPrefixes.some(p => text.startsWith(p)) && !text.startsWith(CONFIG.prefix)) {
      log.warn(`🤖 ANTI-BOT: Potential bot detected from ${sender} (Prefix match)`);
    }

    // --- AUTO-PURGE: Zero Tolerance (Phase 11) ---
    if (this.autoPurgeChats && this.autoPurgeChats.has(chatId)) {
      const hasLink = text && (text.includes('http://') || text.includes('https://') || text.includes('wa.me/'));
      if (hasLink) {
        log.warn(`🛡️ AUTO-PURGE: Unauthorized link from ${sender} in ${chatId}`);
        await this.neutralizeThreat(chatId, sender, message, "Auto-Purge: Unauthorized Content (Link)");
        return false;
      }
    }

    return true;


  }

  /**
   * Neutralizes a threat by deleting the message and kicking the user
   */
  async neutralizeThreat(chatId, sender, message, reason) {
    try {
      // 1. Delete immediately
      await this.sock.sendMessage(chatId, { delete: message.key });

      // 2. Notify
      const userTag = `@${sender.split('@')[0]}`;
      await this.sendMessage(chatId, {
        text: `🛡️ *SHIELD PROTOCOL ACTIVATED* 🛡️\n\n⚠️ *Menace détectée:* ${reason}\n👤 *Source:* ${userTag}\n\n*Action:* Suppression immédiate et bannissement du périmètre. \n\n_Sécurité AbyssFlow assurée._ ⚔️`,
        mentions: [sender]
      });

      // 3. Kick
      const isBotAdmin = await this.isBotGroupAdmin(chatId);
      if (isBotAdmin) {
        await this.sock.groupParticipantsUpdate(chatId, [sender], "remove");
        log.info(`🛡️ SHIELD: User ${sender} kicked from ${chatId} for ${reason}`);
      } else {
        log.warn(`🛡️ SHIELD: Failed to kick ${sender} in ${chatId} - Bot is not admin`);
      }
    } catch (error) {
      log.error('Shield neutralization error:', error.message);
    }
  }


  async addWarning(groupId, userId, reason) {
    try {
      let stats = await Warning.findOne({ userId, groupId });
      if (!stats) stats = new Warning({ userId, groupId });

      stats.warnings += 1;
      stats.reasons.push({ text: reason });
      await stats.save();

      const userTag = `@${userId.split('@')[0]}`;
      const warnMsg = `⚠️ *AVERTISSEMENT* ⚠️\n\n👤 *Utilisateur:* ${userTag}\n🔰 *Raison:* ${reason}\n🚩 *Total:* ${stats.warnings}/3\n\n_Fais attention bg, à 3 avertissements c'est le kick automatique ! ⚔️_`;

      await this.sendMessage(groupId, { text: warnMsg, mentions: [userId] });

      if (stats.warnings >= 3) {
        await this.sendMessage(groupId, { text: `💀 ${userTag} a atteint la limite. Adios mola ! 💨`, mentions: [userId] });
        await this.sock.groupParticipantsUpdate(groupId, [userId], "remove");
        // Reset warnings after kick
        await Warning.deleteOne({ userId, groupId });
      }
    } catch (error) {
      log.error('Failed to add warning:', error.message);
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
      if (!groupId.endsWith('@g.us')) return false;
      const groupMetadata = await this.sock.groupMetadata(groupId);
      const myId = this.sock.user?.id || this.sock.authState.creds.me?.id;
      if (!myId) return false;

      // Ensure proper JID normalization (remove :device and ensure @s.whatsapp.net)
      const botJid = myId.split(':')[0].split('@')[0] + '@s.whatsapp.net';

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

  async broadcast(content) {
    try {
      if (!this.sock) return;

      const chats = await this.sock.groupFetchAllParticipating();
      const groupIds = Object.keys(chats);

      log.info(`Broadcasting to ${groupIds.length} groups...`);

      for (const groupId of groupIds) {
        try {
          let messageText = "";

          // Generate unique message if content is a generator function
          if (typeof content === 'function') {
            messageText = await content(groupId);
          } else {
            messageText = content;
          }

          if (messageText) {
            await this.sendMessage(groupId, { text: messageText });
            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (err) {
          log.error(`Failed to send broadcast to ${groupId}:`, err.message);
        }
      }
    } catch (error) {
      log.error('Broadcast failed:', error.message);
    }
  }

  async startScheduledGreetings() {
    log.info('⏰ Scheduled greetings activated (5 AM & Midnight)');

    // 1. Cleanup existing tasks to prevent duplicates
    if (this.morningTask) this.morningTask.stop();
    if (this.midnightTask) this.midnightTask.stop();

    // 2. Bonjour Comunidad (5:00 AM)
    this.morningTask = cron.schedule('0 5 * * *', async () => {
      log.info('🌅 Morning greeting triggered');
      if (Brain) {
        // Pass generator function for unique messages per group
        await this.broadcast(async () => await Brain.generateAutoMessage('morning'));
      }
    }, { timezone: "Africa/Douala" });

    // 3. Good Coding Time (Midnight)
    this.midnightTask = cron.schedule('0 0 * * *', async () => {
      log.info('🌙 Midnight coding greeting triggered');
      if (Brain) {
        // Pass generator function for unique messages per group
        await this.broadcast(async () => await Brain.generateAutoMessage('midnight'));
      }
    }, { timezone: "Africa/Douala" });
  }

  async startAutoStatus() {
    log.info('📱 Auto Status updates activated (Every 6h)');

    // Cleanup existing
    if (this.statusTask) this.statusTask.stop();

    // Run every 6 hours (8am, 2pm, 8pm...)
    this.statusTask = cron.schedule('0 */6 * * *', async () => {
      log.info('📸 Generating new WhatsApp Status...');
      if (Brain) {
        const statusText = await Brain.generateStatus();
        if (statusText) {
          await this.sendMessage('status@broadcast', {
            text: statusText,
            backgroundColor: '#315558', // XyberClan Teal
            font: 2 // Action Font
          });
        }
      }
    }, { timezone: "Africa/Douala" });
  }

  /**
   * GHOST-CORE: Human Activity Simulator (Phase 9)
   * Periodically performs background actions to look like a real user.
   */
  async startGhostCore() {
    log.info('👻 GHOST-CORE: Anti-Ban activity active');
    setInterval(async () => {
      try {
        if (!this.sock || this.cloakMode) return;

        // 1. Simulate "Online" status
        await this.sock.sendPresenceUpdate('available');
        await delay(Math.floor(Math.random() * 4000) + 1000);
        await this.sock.sendPresenceUpdate('unavailable');

        log.debug('👻 GHOST-CORE: Performed human activity pulse.');
      } catch (e) {
        log.warn('GHOST-CORE pulse inhibited:', e.message);
      }
    }, (Math.floor(Math.random() * 10) + 5) * 60 * 1000); // Every 5-15 minutes
  }
}



module.exports = PsychoBot;
