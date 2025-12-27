#!/usr/bin/env node

const PsychoBot = require('./src/core/PsychoBot');
const BotManager = require('./src/core/BotManager');
const { log } = require('./src/utils/logger');
const cron = require('node-cron');
const express = require('express');
const axios = require('axios');
const path = require('path');
const { CONFIG } = require('./src/config');
const qr = require('qrcode');
const admin = require('./src/core/firebase');
require('dotenv').config();

// --- GLOBAL ERROR HANDLERS ---
process.on('uncaughtException', (error) => {
  const msg = error?.message || String(error);
  const ignorableErrors = ['Connection Closed', 'Timed Out', 'conflict', 'Stream Errored', 'Bad MAC', 'No session found', 'No matching sessions', 'EPIPE', 'ECONNRESET', 'PreKeyError'];
  if (ignorableErrors.some(e => msg.includes(e))) return;
  log.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  const msg = reason?.message || String(reason);
  const ignorableErrors = ['Connection Closed', 'Timed Out', 'conflict', 'Stream Errored', 'Bad MAC', 'No session found', 'No matching sessions', 'EPIPE', 'ECONNRESET', 'PreKeyError'];
  if (ignorableErrors.some(e => msg.includes(e))) return;
  log.error('Unhandled Rejection at:', reason);
});

const app = express();
app.use(express.json());

// --- AUTH MIDDLEWARE ---
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// Admin Only Middleware
const adminOnly = (req, res, next) => {
  if (req.user?.admin || CONFIG.owners.includes(req.user?.uid)) {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: Admin access only' });
  }
};

// --- API ROUTES ---

// 1. Get all active sessions
app.get('/api/sessions', (req, res) => {
  res.json(BotManager.getAllSessions());
});

// 2. Start a new session (Authenticated)
app.post('/api/sessions/start', authenticate, async (req, res) => {
  const { id, pairingNumber, botName } = req.body;
  const userId = req.user.uid;

  // Enforce session ownership (optional check or auto-use UID as ID)
  const sessionId = id || userId;

  try {
    await BotManager.startSession(sessionId, pairingNumber, { botName });
    res.json({ message: `Session ${sessionId} initialization started`, status: 'STARTING' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Route: Get all sessions
app.get('/api/admin/sessions', authenticate, adminOnly, (req, res) => {
  res.json(BotManager.getAllSessions());
});

// 3. Get session status & QR
app.get('/api/sessions/:id/status', async (req, res) => {
  const { id } = req.params;
  const bot = BotManager.instances.get(id);

  if (!bot) return res.json({ status: 'OFFLINE' });

  const response = {
    status: bot.status,
    id: bot.sessionId,
    qr: null
  };

  if (bot.status === 'QR_READY' && bot.qrCode) {
    response.qr = await qr.toDataURL(bot.qrCode);
  }

  res.json(response);
});

// 4. Stop/Delete session
app.delete('/api/sessions/:id', async (req, res) => {
  const { id } = req.params;
  const success = await BotManager.stopSession(id);
  res.json({ success });
});

// Health check & Root
app.get('/', (req, res) => res.send('Psycho Bot Factory is Online! 🏭🚀'));
app.get('/health', (req, res) => res.status(200).send('OK'));

// Start the server
app.listen(CONFIG.port, async () => {
  log.info(`🚀 Factory Server running on port ${CONFIG.port}`);

  // Auto-start primary session if configured
  const primaryId = process.env.PRIMARY_SESSION_ID || 'primary';
  await BotManager.startSession(primaryId);
});

// Self-ping to keep alive on Render
cron.schedule('*/10 * * * *', async () => {
  try {
    if (CONFIG.renderUrl) {
      const url = CONFIG.renderUrl.endsWith('/') ? CONFIG.renderUrl : `${CONFIG.renderUrl}/`;
      await axios.get(`${url}health`);
      log.info('🔄 Factory Keep-alive successful');
    }
  } catch (error) {
    log.error('❌ Factory Keep-alive failed:', error.message);
  }
});
