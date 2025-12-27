const EventEmitter = require('events');
const PsychoBot = require('./PsychoBot');
const { log } = require('../utils/logger');

class BotManager extends EventEmitter {
    constructor() {
        super();
        this.instances = new Map();
    }

    async startSession(sessionId, pairingNumber = null, options = {}) {
        if (this.instances.has(sessionId)) {
            log.info(`Session ${sessionId} already active.`);
            return this.instances.get(sessionId);
        }

        log.info(`Starting new session: ${sessionId} (Name: ${options.botName || 'Default'})`);
        const bot = new PsychoBot(sessionId, options);

        // Setup listener for QR and Status
        bot.on('connection.update', (update) => {
            this.emit('status', { sessionId, ...update });
        });

        this.instances.set(sessionId, bot);
        await bot.start(pairingNumber);

        return bot;
    }

    async stopSession(sessionId) {
        const bot = this.instances.get(sessionId);
        if (bot) {
            if (bot.sock) {
                await bot.sock.logout();
                await bot.sock.end();
            }
            this.instances.delete(sessionId);
            log.info(`Session ${sessionId} stopped.`);
            return true;
        }
        return false;
    }

    getStatus(sessionId) {
        const bot = this.instances.get(sessionId);
        if (!bot) return 'OFFLINE';
        return bot.status || 'CONNECTING';
    }

    getAllSessions() {
        const sessions = [];
        for (const [id, bot] of this.instances) {
            sessions.push({
                id,
                status: bot.status || 'UNKNOWN',
                connectedAt: bot.metrics?.startedAt
            });
        }
        return sessions;
    }
}

module.exports = new BotManager();
