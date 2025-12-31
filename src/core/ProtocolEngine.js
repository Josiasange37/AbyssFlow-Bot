const { log } = require('../utils/logger');

/**
 * ProtocolEngine - Specialized Enforcement & Signature Management
 * Part of Project AbyssFlow: Architectural Supremacy (Phase 17)
 */
class ProtocolEngine {
    constructor(bot) {
        this.bot = bot;

        // Protocol Sets (Migrated from PsychoBot)
        this.shadowBannedUsers = bot.shadowBannedUsers || new Set();
        this.blackoutList = bot.blackoutList || new Set();
        this.mutedUsers = bot.mutedUsers || new Map();
        this.paralyzedUsers = bot.paralyzedUsers || new Map();
        this.vexedUsers = bot.vexedUsers || new Map();
        this.watchdogList = bot.watchdogList || new Set();

        // Audit Tracking
        this.neutralizationCount = 0;
        this.startSessionTime = Date.now();
    }

    /**
     * Interdicts asocial entities based on active protocol state.
     * Returns true if message processing should stop (Interdiction active).
     */
    async evaluateInterdiction(chatId, sender, message, text) {
        const isOwner = this.bot.isOwner(sender);
        const isGroup = chatId.endsWith('@g.us');

        if (isOwner || message.key.fromMe) return false;

        // 1. SHADOW BAN (Total Silence)
        if (this.shadowBannedUsers.has(sender)) return true;

        // 2. BLACKOUT (Media Blockage)
        if (this.blackoutList.has(sender)) {
            const msg = message.message;
            const isMedia = msg.imageMessage || msg.videoMessage || msg.audioMessage || msg.documentMessage;
            if (isMedia) {
                try {
                    await this.bot.sock.sendMessage(chatId, { delete: message.key });
                    log.info(`[ProtocolEngine] BLACKOUT neutralized media from ${sender}`);
                } catch (e) { }
                return true;
            }
        }

        // 3. SELECTIVE MUTE (Group Enforcement)
        if (isGroup && this.mutedUsers.has(chatId)) {
            const mutedList = this.mutedUsers.get(chatId);
            if (mutedList.has(sender)) {
                try {
                    await this.bot.sock.sendMessage(chatId, { delete: message.key });
                } catch (e) { }
                return true;
            }
        }

        // 4. PARALYZE (Social Vacuum)
        if (isGroup && this.paralyzedUsers.has(chatId)) {
            const paralyzedList = this.paralyzedUsers.get(chatId);
            if (paralyzedList.has(sender)) {
                try {
                    await this.bot.sock.sendMessage(chatId, {
                        edit: message.key,
                        text: '🔇 [ NEUTRALIZED BY ABYSSFLOW PROTOCOL ]'
                    });
                } catch (e) { }
                return true;
            }
        }

        return false;
    }

    // --- Audit Interface ---
    incrementNeutralization() {
        this.neutralizationCount++;
    }

    getAuditStats() {
        return {
            neutralizations: this.neutralizationCount,
            activeProtocols: {
                shadowBan: this.shadowBannedUsers.size,
                blackout: this.blackoutList.size,
                mute: Array.from(this.mutedUsers.values()).reduce((a, b) => a + b.size, 0),
                vex: Array.from(this.vexedUsers.values()).reduce((a, b) => a + b.size, 0)
            },
            uptime: Date.now() - this.startSessionTime
        };
    }
}

module.exports = ProtocolEngine;
