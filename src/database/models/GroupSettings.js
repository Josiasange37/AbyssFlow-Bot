const mongoose = require('mongoose');

const groupSettingsSchema = new mongoose.Schema({
    groupId: { type: String, required: true, unique: true },
    welcome: { type: Boolean, default: true },
    antiDelete: { type: Boolean, default: true },
    autoMod: { type: Boolean, default: true },
    chatbot: { type: Boolean, default: true },
    economy: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('GroupSettings', groupSettingsSchema);
