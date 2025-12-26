require('dotenv').config();

const CONFIG = {
  botName: process.env.BOT_NAME || 'Psycho Bot',
  owners: process.env.BOT_OWNERS
    ? process.env.BOT_OWNERS.split(',').map((v) => v.trim()).filter(Boolean)
    : [],
  prefix: process.env.BOT_PREFIX?.trim() || '*',
  sessionPath: process.env.SESSION_PATH || './session',
  maxCommandsPerMinute: Number(process.env.MAX_COMMANDS_PER_MINUTE) || 12,
  minDelay: Number(process.env.RESPONSE_DELAY_MIN_MS) || 250,
  maxDelay: Number(process.env.RESPONSE_DELAY_MAX_MS) || 900,
  reconnectBase: Number(process.env.RECONNECT_BASE_DELAY_MS) || 2000,
  reconnectMax: Number(process.env.RECONNECT_MAX_DELAY_MS) || 15000,
  logLevel: process.env.LOG_LEVEL || 'info',
  creator: {
    name: process.env.CREATOR_NAME || 'Josias',
    bio: process.env.CREATOR_BIO || 'Dev of Psycho Bot',
    tagline: process.env.CREATOR_TAGLINE || 'Casual bot for cool people',
    location: process.env.CREATOR_LOCATION || 'Cameroun',
    skills: process.env.CREATOR_SKILLS || 'JS, Node, React',
    linkedin: process.env.CREATOR_LINKEDIN || '',
    github: process.env.CREATOR_GITHUB || '',
    portfolio: process.env.CREATOR_PORTFOLIO || '',
    x: process.env.CREATOR_X || '',
    tiktok: process.env.CREATOR_TIKTOK || '',
    twitter: process.env.CREATOR_TWITTER || process.env.CREATOR_X || '',
    instagram: process.env.CREATOR_INSTAGRAM || '',
    youtube: process.env.CREATOR_YOUTUBE || '',
    githubUsername: process.env.CREATOR_GITHUB_USERNAME || '',
    githubBio: process.env.CREATOR_GITHUB_BIO || '',
    CREATOR_STARTUP: process.env.CREATOR_STARTUP || 'Psycho Corp',
    CREATOR_STARTUP_URL: process.env.CREATOR_STARTUP_URL || '',
    CONTACT_EMAIL: process.env.CONTACT_EMAIL || '',
  },
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  hfToken: process.env.HF_TOKEN || '',
  groqApiKey: process.env.GROQ_API_KEY || '',
  githubToken: process.env.GITHUB_TOKEN || '',
  cohereApiKey: process.env.COHERE_API_KEY || '',
  mistralApiKey: process.env.MISTRAL_API_KEY || '',
  mistralAgentId: process.env.MISTRAL_AGENT_ID || 'ag_019b5b38190670e7a41f56581ab8f052',
  // Constants
  FALLBACK_VERSION: [2, 3000, 38],
  RATE_WINDOW_MS: 60_000,
  GITHUB_CACHE_TTL_MS: 5 * 60_000
};

module.exports = { CONFIG };
