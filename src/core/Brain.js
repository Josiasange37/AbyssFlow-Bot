const { OpenAI } = require('openai');
const { CohereClient } = require('cohere-ai');
const { log } = require('../utils/logger');
const axios = require('axios');
const { CONFIG } = require('../config');
const fs = require('fs-extra');
const path = require('path');
const Memory = require('./Memory');

// Modular Providers
const GroqProvider = require('./brain/providers/GroqProvider');
const MistralProvider = require('./brain/providers/MistralProvider');
const Persona = require('./brain/Persona');

/**
 * PsychoBrain - Refactored Core (v2.0)
 * Uses modular providers for Groq and Mistral.
 * Keeps legacy providers inline for now (GitHub, Cohere, DeepSeek).
 */
class PsychoBrain {
    constructor() {
        this.historyDir = path.join(process.cwd(), 'data', 'history');

        this.githubClient = null;
        this.cohere = null;
        this.hfClient = null;

        this.maxHistory = 20;
        this.maxMemoryChats = 100;
        this.memoryHistory = new Map();
        this.isInitialized = false;

        this.providerHealth = {
            groq: { available: false, errors: 0, lastError: 0, cooldownUntil: 0, failCount: 0 },
            mistral: { available: false, errors: 0, lastError: 0, cooldownUntil: 0, failCount: 0 },
            github: { available: false, errors: 0, lastError: 0, cooldownUntil: 0, failCount: 0 },
            cohere: { available: false, errors: 0, lastError: 0, cooldownUntil: 0, failCount: 0 },
            deepseek: { available: false, errors: 0, lastError: 0, cooldownUntil: 0, failCount: 0 }
        };

        this.QUOTA_COOLDOWN = 60 * 60 * 1000;
        this.ERROR_COOLDOWN = 30 * 1000;
        this.HEALTH_CHECK_INTERVAL = 30 * 60 * 1000;

        this.initProviders();
        fs.ensureDirSync(this.historyDir);
        this.startHealthMonitor();
    }

    async initProviders() {
        // 1. Groq (Primary)
        if (GroqProvider.init()) {
            this.providerHealth.groq.available = true;
        }

        // 2. Mistral (Secondary + Vision + Tools)
        if (MistralProvider.init()) {
            this.providerHealth.mistral.available = true;
        }

        // 3. GitHub Models
        if (CONFIG.githubToken) {
            try {
                this.githubClient = new OpenAI({
                    baseURL: "https://models.inference.ai.azure.com",
                    apiKey: CONFIG.githubToken
                });
                this.providerHealth.github.available = true;
                log.info('🐙 GitHub Models Initialized');
            } catch (e) { log.error(`GitHub init failed: ${e.message}`); }
        }

        // 4. Cohere
        if (CONFIG.cohereApiKey) {
            try {
                this.cohere = new CohereClient({ token: CONFIG.cohereApiKey });
                this.providerHealth.cohere.available = true;
                log.info('🦜 Cohere Initialized');
            } catch (e) { log.error(`Cohere init failed: ${e.message}`); }
        }

        // 5. DeepSeek
        if (CONFIG.hfToken) {
            try {
                this.hfClient = new OpenAI({
                    baseURL: "https://api-inference.huggingface.co/v1/",
                    apiKey: CONFIG.hfToken
                });
                this.providerHealth.deepseek.available = true;
                log.info('🦄 DeepSeek (HF) Initialized');
            } catch (e) { log.error(`DeepSeek init failed: ${e.message}`); }
        }

        this.isInitialized = true;
        log.info(`🧠 PsychoBrain Refactored Initialized.`);
    }

    // Required by PsychoBot startup check
    async init() {
        return this.isInitialized;
    }

    isProviderAvailable(providerName) {
        const health = this.providerHealth[providerName];
        if (!health || !health.available) return false;
        if (Date.now() < health.cooldownUntil) {
            return false;
        }
        return true;
    }

    setProviderCooldown(providerName, error) {
        const health = this.providerHealth[providerName];
        if (!health) return;
        health.lastError = error.message;
        health.failCount++;
        const isQuota = error.message?.includes('429') || error.message?.includes('quota');
        health.cooldownUntil = Date.now() + (isQuota ? this.QUOTA_COOLDOWN : this.ERROR_COOLDOWN);
        log.warn(`⚠️ ${providerName} cooldown: ${error.message}`);
    }

    resetProviderHealth(providerName) {
        if (!this.providerHealth[providerName]) return;
        this.providerHealth[providerName].lastError = null;
        this.providerHealth[providerName].cooldownUntil = 0;
        this.providerHealth[providerName].failCount = 0;
    }

    startHealthMonitor() {
        setInterval(() => {
            ['groq', 'mistral'].forEach(p => {
                if (this.isProviderAvailable(p)) { /* already good */ }
                else if (this.providerHealth[p].available && Date.now() > this.providerHealth[p].cooldownUntil) {
                    this.resetProviderHealth(p);
                    log.info(`✅ ${p} cooldown expired.`);
                }
            });
        }, this.HEALTH_CHECK_INTERVAL);
    }

    async getHistory(chatId) {
        if (this.memoryHistory.has(chatId)) return this.memoryHistory.get(chatId);
        try {
            const filePath = path.join(this.historyDir, `${chatId.replace(/[:@]/g, '_')}.json`);
            if (await fs.exists(filePath)) {
                const data = await fs.readJson(filePath);
                this.memoryHistory.set(chatId, data);
                return data;
            }
        } catch (e) { }
        return [];
    }

    async saveHistory(chatId, history) {
        const limited = history.slice(-50);
        this.memoryHistory.set(chatId, limited);
        try {
            const filePath = path.join(this.historyDir, `${chatId.replace(/[:@]/g, '_')}.json`);
            await fs.writeJson(filePath, limited);
        } catch (e) { }
    }

    async logMessage(chatId, senderName, text) {
        const hist = await this.getHistory(chatId);
        hist.push({ role: "user", text: `${senderName}: ${text}` });
        await this.saveHistory(chatId, hist);
    }

    async searchInternet(query) {
        if (!CONFIG.keys.search) return null;
        try {
            const response = await axios.get('https://serpapi.com/search', {
                params: { q: query, api_key: CONFIG.keys.search, engine: 'google', num: 3 }, timeout: 5000
            });
            const results = response.data.organic_results;
            if (results?.length > 0) return results.map(r => `[${r.title}] ${r.snippet}`).join('\n');
        } catch (e) { }
        return null;
    }

    // --- MAIN PROCESS ---
    async process(text, chatId = 'global', media = null, userName = 'User') {
        if (!this.isInitialized) return "Brain offline (Init failed).";

        // 1. Get System Prompt from Persona
        const systemPrompt = Persona.generateSystemPrompt(userName);
        const chatHistory = await this.getHistory(chatId);

        // 2. Special Commands (Mistral Routing)
        if (text.startsWith('!imagine ')) {
            return await MistralProvider.generateImage(text.replace('!imagine ', '')) || "Image failed.";
        }
        if (text.startsWith('!search ')) {
            // Note: search uses tools, implemented in MistralProvider? Not yet exposed as method.
            // Simplified: Use internet search local + text gen.
            const results = await this.searchInternet(text.replace('!search ', ''));
            return results ? `Résultats:\n${results}` : "Rien trouvé.";
        }

        // 3. Selfie (New Feature)
        const selfieTriggers = ['envoie une photo de toi', 't\'es flou', 'ta tête', 'selfie', 'montre toi'];
        if (selfieTriggers.some(k => text.toLowerCase().includes(k)) && text.length < 50) {
            const selfiePrompt = "A realistic cyberpunk anime boy, 18 years old, hoodies, glowing blue eyes, coding in a dark room with neon lights, messy hair, looking at camera";
            const img = await MistralProvider.generateImage(selfiePrompt);
            if (img) return `${img}\n\nC'est moi. Bg ou pas ? 😎`;
        }

        // 4. Internet Context
        let searchContext = "";
        const searchKeywords = ['news', 'actualité', 'meteo', 'météo', 'bourse', 'score'];
        if (CONFIG.keys.search && !media && searchKeywords.some(k => text.toLowerCase().includes(k))) {
            const results = await this.searchInternet(text);
            if (results) searchContext = `\n\n[INFO LIVE WEB]:\n${results}`;
        }
        const finalText = text + searchContext;

        // 5. Providers Loop
        const providers = [];

        // Priority Logic
        if (media) {
            // Multimodal: Mistral (Pixtral) -> GitHub
            providers.push({ name: 'mistral', fn: () => MistralProvider.process(finalText, chatHistory, media, systemPrompt) });
            providers.push({ name: 'github', fn: () => this.processGitHub(finalText, chatHistory, media) });
        } else {
            // Text: Groq -> Mistral
            providers.push({ name: 'groq', fn: () => GroqProvider.process(finalText, chatHistory, systemPrompt) });
            providers.push({ name: 'mistral', fn: () => MistralProvider.process(finalText, chatHistory, null, systemPrompt) });
        }

        let response = null;
        for (const p of providers) {
            if (!this.isProviderAvailable(p.name)) continue;
            try {
                response = await p.fn();
                if (response) {
                    this.resetProviderHealth(p.name);
                    break;
                }
            } catch (e) {
                this.setProviderCooldown(p.name, e);
            }
        }

        if (!response) return "Oops, cerveaux HS. Réessaie dans 10 secondes. 🧠❌";

        // Update Memory
        if (response.includes('[MEMORY:')) {
            const memMatch = response.match(/\[MEMORY: (.*?)\]/);
            if (memMatch) Persona.setFriendFact(userName, memMatch[1]);
        }

        chatHistory.push({ role: "model", text: response });
        await this.saveHistory(chatId, chatHistory);
        return response;
    }

    async generateStatus() {
        // Use Groq for status
        if (this.isProviderAvailable('groq')) {
            const prompt = "Génère un statut WhatsApp court (1 phrase cool) pour Psycho Bot.";
            try {
                return await GroqProvider.process(prompt, [], "You are a creative bot.");
            } catch (e) { }
        }
        return "Mode fantôme activé... 👻";
    }

    async generateVideoDescription(metadata) {
        const prompt = `Description courte (1 phrase) pour vidéo: "${metadata.title}"`;
        if (this.isProviderAvailable('mistral')) {
            try { return await MistralProvider.process(prompt, [], null, "Be concise."); } catch (e) { }
        }
        return "Vidéo intéressante détectée. 🛠️";
    }

    // --- Legacy Providers (Keep for now) ---
    async processGitHub(text, chatHistory, media) {
        // Implementation kept minimal/same
        if (!this.githubClient) throw new Error('GITHUB_NOT_READY');
        const content = [{ type: "text", text: text || "Analyze." }];
        if (media) content.push({ type: "image_url", image_url: { url: `data:${media.mimetype};base64,${media.buffer.toString('base64')}` } });
        const messages = [{ role: "system", content: "Act like Psycho Bot." }, ...chatHistory.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text || "" })), { role: "user", content: content }];
        const completion = await this.githubClient.chat.completions.create({ model: "gpt-4o-mini", messages: messages, max_tokens: 512 });
        return completion.choices[0]?.message?.content || "";
    }
}

module.exports = new PsychoBrain();
