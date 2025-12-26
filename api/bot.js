const express = require("express");
const app = express();
const path = require("path");
const PsychoBot = require('../src/core/PsychoBot');
const { log } = require('../src/utils/logger');
const { CONFIG } = require('../src/config');
const { keepAlive } = require('../src/utils/keepAlive');
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });

// Port configuration
const PORT = process.env.PORT || 8080;

// Handle uncaught exceptions and unhandled rejections
const handleGlobalError = (error, type) => {
  const msg = error?.message || String(error);
  const ignorableErrors = [
    'Connection Closed',
    'Timed Out',
    'conflict',
    'Stream Errored',
    'Bad MAC',
    'No session found',
    'No matching sessions',
    'EPIPE',
    'ECONNRESET',
    'PreKeyError'
  ];

  if (ignorableErrors.some(e => msg.includes(e))) {
    log.warn(`[GLOBAL ${type}] Caught expected non-fatal error: ${msg}. Bot will attempt recovery.`);
    return;
  }
  log.error(`[GLOBAL ${type}] Uncaught Exception:`, error);
  process.exit(1);
};

process.on('uncaughtException', (error) => handleGlobalError(error, 'EXCEPTION'));
process.on('unhandledRejection', (reason) => handleGlobalError(reason, 'REJECTION'));

// Basic health check
app.get("/", (req, res) => {
  res.send("AbyssFlow Bot is running and healthy!");
});

// Start the bot directly (since AbyssFlow manages its own connection)
(async () => {
  try {
    const bot = new PsychoBot();
    await bot.start();
    log.info('Bot instance started via API wrapper');

    // Prevent Render from sleeping
    if (process.env.APP_URL) {
      keepAlive(process.env.APP_URL);
    }
  } catch (error) {
    log.error('Failed to start bot instance:', error);
  }
})();

// Start Express server
const server = app.listen(PORT, () => {
  log.info(`🚀 API Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  log.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    log.info('Process terminated');
  });
});
