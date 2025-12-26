const mongoose = require('mongoose');

const lockSchema = new mongoose.Schema({
    instanceId: { type: String, default: 'primary' },
    lastHeartbeat: { type: Date, default: Date.now },
    processId: { type: Number },
    hostname: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Lock', lockSchema);
