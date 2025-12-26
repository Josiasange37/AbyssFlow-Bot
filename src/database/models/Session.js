const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    data: { type: String, required: true } // JSON stringified session data
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
