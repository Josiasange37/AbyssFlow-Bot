const mongoose = require('mongoose');
const { log } = require('../utils/logger');
const { CONFIG } = require('../config');

async function connectDB() {
    if (!CONFIG.mongoUri) {
        log.warn('⚠️ MONGO_URI missing. Persistent memory will be local only (JSON).');
        return false;
    }

    try {
        // Disable buffering to fail fast if connection is down
        mongoose.set('bufferCommands', false);

        await mongoose.connect(CONFIG.mongoUri, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            connectTimeoutMS: 10000,
        });

        log.info('🔌 Connected to MongoDB Atlas.');
        return true;
    } catch (error) {
        log.error('❌ MongoDB Connection Error:', error.message);
        return false;
    }
}

module.exports = { connectDB };
