const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.API_PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'abyssflow-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Database paths
const DB_PATH = path.join(__dirname, '../data');
const USERS_DB = path.join(DB_PATH, 'users.json');
const SESSIONS_DB = path.join(DB_PATH, 'sessions.json');
const PAYMENTS_DB = path.join(DB_PATH, 'payments.json');

// Ensure database files exist
async function initDatabase() {
  await fs.ensureDir(DB_PATH);
  
  if (!await fs.pathExists(USERS_DB)) {
    await fs.writeJson(USERS_DB, { users: [] });
  }
  
  if (!await fs.pathExists(SESSIONS_DB)) {
    await fs.writeJson(SESSIONS_DB, { sessions: [] });
  }
  
  if (!await fs.pathExists(PAYMENTS_DB)) {
    await fs.writeJson(PAYMENTS_DB, { payments: [] });
  }
}

// Helper functions
async function readDB(file) {
  return await fs.readJson(file);
}

async function writeDB(file, data) {
  await fs.writeJson(file, data, { spaces: 2 });
}

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Middleware to verify payment
async function verifyPayment(req, res, next) {
  const paymentsDB = await readDB(PAYMENTS_DB);
  const payment = paymentsDB.payments.find(p => 
    p.userId === req.userId && 
    p.status === 'active' &&
    new Date(p.expiresAt) > new Date()
  );
  
  if (!payment) {
    return res.status(403).json({ 
      error: 'Payment required',
      message: 'You must have an active subscription to access the bot',
      redirectTo: '/dashboard/upgrade'
    });
  }
  
  req.userPlan = payment.plan;
  next();
}

// ============================================
// AUTH ROUTES
// ============================================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password, plan } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const usersDB = await readDB(USERS_DB);
    
    // Check if user exists
    if (usersDB.users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Create user
    const user = {
      id: Date.now().toString(),
      name,
      email,
      phone: phone || null,
      password, // In production, hash this!
      plan: 'free', // Always start with free
      createdAt: new Date().toISOString(),
      verified: false,
      hasPayment: false
    };
    
    usersDB.users.push(user);
    await writeDB(USERS_DB, usersDB);
    
    // Generate token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        hasPayment: user.hasPayment
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const usersDB = await readDB(USERS_DB);
    const user = usersDB.users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        hasPayment: user.hasPayment
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const usersDB = await readDB(USERS_DB);
    const user = usersDB.users.find(u => u.id === req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      plan: user.plan,
      hasPayment: user.hasPayment,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// ============================================
// PAYMENT ROUTES
// ============================================

// Create payment (simulate payment)
app.post('/api/payment/create', verifyToken, async (req, res) => {
  try {
    const { plan, paymentMethod } = req.body;
    
    if (!['gold', 'pro'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    
    const prices = {
      gold: 9.99,
      pro: 24.99
    };
    
    // Create payment record
    const payment = {
      id: Date.now().toString(),
      userId: req.userId,
      plan,
      amount: prices[plan],
      currency: 'USD',
      status: 'active', // In production, this would be 'pending' until payment confirmed
      paymentMethod: paymentMethod || 'card',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };
    
    const paymentsDB = await readDB(PAYMENTS_DB);
    
    // Deactivate old payments
    paymentsDB.payments = paymentsDB.payments.map(p => 
      p.userId === req.userId ? { ...p, status: 'cancelled' } : p
    );
    
    paymentsDB.payments.push(payment);
    await writeDB(PAYMENTS_DB, paymentsDB);
    
    // Update user
    const usersDB = await readDB(USERS_DB);
    const userIndex = usersDB.users.findIndex(u => u.id === req.userId);
    if (userIndex !== -1) {
      usersDB.users[userIndex].plan = plan;
      usersDB.users[userIndex].hasPayment = true;
      await writeDB(USERS_DB, usersDB);
    }
    
    res.json({
      success: true,
      payment: {
        id: payment.id,
        plan: payment.plan,
        amount: payment.amount,
        status: payment.status,
        expiresAt: payment.expiresAt
      }
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Payment failed' });
  }
});

// Get user payments
app.get('/api/payment/status', verifyToken, async (req, res) => {
  try {
    const paymentsDB = await readDB(PAYMENTS_DB);
    const userPayments = paymentsDB.payments.filter(p => p.userId === req.userId);
    
    const activePayment = userPayments.find(p => 
      p.status === 'active' && 
      new Date(p.expiresAt) > new Date()
    );
    
    res.json({
      hasPayment: !!activePayment,
      activePayment: activePayment || null,
      history: userPayments.slice(-5).reverse()
    });
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
});

// ============================================
// BOT ROUTES (PROTECTED)
// ============================================

// Generate QR Code - REQUIRES PAYMENT
app.post('/api/bot/qr', verifyToken, verifyPayment, async (req, res) => {
  try {
    // Check if user already has an active session
    const sessionsDB = await readDB(SESSIONS_DB);
    const existingSession = sessionsDB.sessions.find(s => 
      s.userId === req.userId && 
      s.status === 'active'
    );
    
    if (existingSession) {
      return res.status(400).json({ 
        error: 'Session already exists',
        message: 'You already have an active bot session'
      });
    }
    
    // Generate session
    const session = {
      id: Date.now().toString(),
      userId: req.userId,
      qrCode: `abyssflow://connect?session=${Date.now()}&user=${req.userId}`,
      status: 'pending',
      plan: req.userPlan,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
    };
    
    sessionsDB.sessions.push(session);
    await writeDB(SESSIONS_DB, sessionsDB);
    
    res.json({
      success: true,
      qrCode: session.qrCode,
      sessionId: session.id,
      expiresAt: session.expiresAt
    });
  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Connect with phone - REQUIRES PAYMENT
app.post('/api/bot/connect-phone', verifyToken, verifyPayment, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number required' });
    }
    
    // Check if user already has an active session
    const sessionsDB = await readDB(SESSIONS_DB);
    const existingSession = sessionsDB.sessions.find(s => 
      s.userId === req.userId && 
      s.status === 'active'
    );
    
    if (existingSession) {
      return res.status(400).json({ 
        error: 'Session already exists',
        message: 'You already have an active bot session'
      });
    }
    
    // Create session
    const session = {
      id: Date.now().toString(),
      userId: req.userId,
      phoneNumber,
      status: 'active',
      plan: req.userPlan,
      createdAt: new Date().toISOString()
    };
    
    sessionsDB.sessions.push(session);
    await writeDB(SESSIONS_DB, sessionsDB);
    
    res.json({
      success: true,
      sessionId: session.id,
      message: 'Bot connected successfully'
    });
  } catch (error) {
    console.error('Phone connect error:', error);
    res.status(500).json({ error: 'Failed to connect with phone' });
  }
});

// Get bot status
app.get('/api/bot/status', verifyToken, async (req, res) => {
  try {
    const sessionsDB = await readDB(SESSIONS_DB);
    const session = sessionsDB.sessions.find(s => 
      s.userId === req.userId && 
      s.status === 'active'
    );
    
    res.json({
      connected: !!session,
      session: session || null
    });
  } catch (error) {
    console.error('Bot status error:', error);
    res.status(500).json({ error: 'Failed to get bot status' });
  }
});

// Disconnect bot
app.post('/api/bot/disconnect', verifyToken, async (req, res) => {
  try {
    const sessionsDB = await readDB(SESSIONS_DB);
    const sessionIndex = sessionsDB.sessions.findIndex(s => 
      s.userId === req.userId && 
      s.status === 'active'
    );
    
    if (sessionIndex === -1) {
      return res.status(404).json({ error: 'No active session found' });
    }
    
    sessionsDB.sessions[sessionIndex].status = 'disconnected';
    sessionsDB.sessions[sessionIndex].disconnectedAt = new Date().toISOString();
    await writeDB(SESSIONS_DB, sessionsDB);
    
    res.json({
      success: true,
      message: 'Bot disconnected successfully'
    });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect bot' });
  }
});

// ============================================
// STATS ROUTES
// ============================================

app.get('/api/stats', verifyToken, verifyPayment, async (req, res) => {
  try {
    // Mock stats - in production, get from actual bot
    res.json({
      groups: 12,
      messages: 2456,
      commands: 156,
      uptime: '99.9%'
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ============================================
// START SERVER
// ============================================

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🌊 AbyssFlow API running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:3000`);
    console.log(`🔐 Authentication: ENABLED`);
    console.log(`💳 Payment verification: ENABLED`);
  });
});

module.exports = app;
