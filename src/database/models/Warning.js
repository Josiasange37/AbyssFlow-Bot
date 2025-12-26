const mongoose = require('mongoose');

const warnSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    groupId: { type: String, required: true },
    warnings: { type: Number, default: 0 },
    reasons: [{
        text: String,
        date: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

warnSchema.index({ userId: 1, groupId: 1 }, { unique: true });

module.exports = mongoose.model('Warning', warnSchema);
