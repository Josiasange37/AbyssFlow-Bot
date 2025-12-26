const mongoose = require('mongoose');
const { log } = require('../utils/logger');
const { CONFIG } = require('../config');

async function connectDB() {
    if (!CONFIG.mongoUri) {
        log.warn('⚠️ MONGO_URI missing. Persistent memory will be local only (JSON).');
        return false;
    }

    try {
        await mongoose.connect(CONFIG.mongoUri);
        log.info('🔌 Connected to MongoDB Atlas.');
        return true;
    } catch (error) {
        log.error('❌ MongoDB Connection Error:', error.message);
        return false;
    }
}

module.exports = { connectDB };
