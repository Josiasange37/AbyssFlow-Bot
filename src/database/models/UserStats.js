const mongoose = require('mongoose');

const userStatsSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // jid
    groupId: { type: String, required: true }, // groupId
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    messagesCount: { type: Number, default: 0 },
    lastMessageAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure unique entry per user per group
userStatsSchema.index({ userId: 1, groupId: 1 }, { unique: true });

module.exports = mongoose.model('UserStats', userStatsSchema);
