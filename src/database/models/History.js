const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
    chatId: { type: String, required: true, index: true },
    messages: [
        {
            role: { type: String, enum: ['user', 'model', 'assistant', 'system'], required: true },
            text: { type: String, required: true },
            senderName: { type: String },
            timestamp: { type: Date, default: Date.now }
        }
    ],
    lastUpdated: { type: Date, default: Date.now }
});

// Keep history lean - only store last 50 messages per chat for context
HistorySchema.pre('save', function (next) {
    if (this.messages.length > 50) {
        this.messages = this.messages.slice(-50);
    }
    this.lastUpdated = Date.now();
    next();
});

module.exports = mongoose.model('History', HistorySchema);
