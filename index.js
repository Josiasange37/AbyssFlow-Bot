#!/usr/bin/env node

const PsychoBot = require('./src/core/PsychoBot');
const { log } = require('./src/utils/logger');
const cron = require('node-cron');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { CONFIG } = require('./src/config');
const express = require('express');
const axios = require('axios');
require('dotenv').config();

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  const msg = error?.message || String(error);
  // Ignore non-fatal errors that Baileys/Socket handles internally or that are expected during network jitter
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
    log.warn(`Caught expected non-fatal error: ${msg}. Bot will attempt recovery.`);
    return;
  }
  log.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  const msg = reason?.message || String(reason);
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
    log.warn(`Caught expected non-fatal rejection: ${msg}. Bot will attempt recovery.`);
    return;
  }
  log.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the bot
(async () => {
  try {
    const bot = new PsychoBot();
    const sessionDir = path.resolve(CONFIG.sessionPath);
    const sessionExists = fs.existsSync(sessionDir) && fs.readdirSync(sessionDir).length > 0;

    if (!sessionExists) {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const question = (str) => new Promise(resolve => rl.question(str, resolve));

      console.log('\n===================================================');
      console.log('🤖 PSYCHO BOT - CHOIX DE CONNEXION');
      console.log('===================================================');
      console.log('1. Scanner le QR Code (Classique)');
      console.log('2. Code de Connexion (Avec numéro de téléphone)');
      console.log('===================================================\n');

      const answer = await question('👉 Ton choix (1 ou 2) : ');

      if (answer.trim() === '2') {
        const phoneNumber = await question('📱 Entre ton numéro (ex: 33612345678) : ');
        rl.close();
        // Remove non-numeric characters just in case
        const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
        await bot.start(cleanNumber);
      } else {
        console.log('📸 Prépare ton téléphone pour le QR Code...');
        rl.close();
        await bot.start();
      }
    } else {
      await bot.start();
    }

    // --- RENDER ANTI-SLEEP MECHANISM ---
    const app = express();
    app.get('/', (req, res) => res.send('Psycho Bot is Online! 🚀'));
    app.get('/health', (req, res) => res.status(200).send('OK'));

    app.listen(CONFIG.port, () => {
      log.info(`🚀 Keep-alive server running on port ${CONFIG.port}`);
    });

    // Self-pinging every 10 minutes
    cron.schedule('*/10 * * * *', async () => {
      try {
        log.info('🔄 Keep-alive: Self-pinging...');
        if (CONFIG.renderUrl) {
          const url = CONFIG.renderUrl.endsWith('/') ? CONFIG.renderUrl : `${CONFIG.renderUrl}/`;
          await axios.get(`${url}health`);
          log.info('✅ Self-ping successful');
        } else {
          log.warn('⚠️ RENDER_URL not set. Self-ping skipped.');
        }
      } catch (error) {
        log.error('❌ Keep-alive failed:', error.message);
      }
    });
  } catch (error) {
    log.error('Fatal error during startup:', error);
    process.exit(1);
  }
})();
