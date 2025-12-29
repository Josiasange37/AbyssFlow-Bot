const { GoogleGenerativeAI } = require('@google/generative-ai');
const { OpenAI } = require('openai');
const Groq = require('groq-sdk');
const { CohereClient } = require('cohere-ai');
const { Mistral } = require('@mistralai/mistralai');
const { log } = require('../utils/logger');
const axios = require('axios');
const { CONFIG } = require('../config');
const fs = require('fs-extra');
const path = require('path');
const Memory = require('./Memory');

/**
 * PsychoBrain - Advanced AI with Smart Provider Fallback
 * Priority: Gemini 2.5 → Grok (Groq) → Mistral → GitHub → Cohere → DeepSeek
 * Auto-detects quota exhaustion and switches providers intelligently
 */
class PsychoBrain {
    constructor() {
        this.historyDir = path.join(process.cwd(), 'data', 'history');

        // Provider Instances
        this.genAI = null; // For Gemini
        this.geminiModel = null; // Specific model instance for Gemini
        this.mistral = null;
        this.githubClient = null; // For GitHub Models (OpenAI compatible)
        this.groq = null;
        this.cohere = null;
        this.hfClient = null; // For DeepSeek via Hugging Face (OpenAI compatible)

        this.maxHistory = 20;
        this.maxMemoryChats = 100;
        this.memoryHistory = new Map();
        this.isInitialized = false;

        // Provider health tracking for smart fallback
        this.providerHealth = {
            gemini: { available: false, errors: 0, lastError: 0, cooldownUntil: 0, failCount: 0 }, // Merged properties
            groq: { available: false, errors: 0, lastError: 0, cooldownUntil: 0, failCount: 0 },
            mistral: { available: false, errors: 0, lastError: 0, cooldownUntil: 0, failCount: 0 },
            github: { available: false, errors: 0, lastError: 0, cooldownUntil: 0, failCount: 0 },
            cohere: { available: false, errors: 0, lastError: 0, cooldownUntil: 0, failCount: 0 },
            deepseek: { available: false, errors: 0, lastError: 0, cooldownUntil: 0, failCount: 0 }
        };

        // Cooldown durations (ms) for quota errors
        this.QUOTA_COOLDOWN = 60 * 60 * 1000; // 1 hour for quota exhaustion
        this.ERROR_COOLDOWN = 30 * 1000;  // 30 seconds for general errors
        this.HEALTH_CHECK_INTERVAL = 30 * 60 * 1000; // Check health every 30 mins

        // Initialize Mood State
        this.currentMood = {
            energy: 'neutral', // neutral, high, low, chaotic
            valence: 'neutral', // happy, sad, angry, annoyed
            dominantEmotion: 'Calm',
            lastInteractionTime: Date.now()
        };

        this.initProviders();
        fs.ensureDirSync(this.historyDir);
        this.startHealthMonitor();
    }

    /**
     * DYNAMIC PERSONA GENERATOR
     * Constructs a living, breathing system prompt based on context
     */
    generateSystemPrompt(chatId, userName, userMessage) {
        const time = new Date().getHours();
        const isNight = time >= 23 || time < 5;
        const isMorning = time >= 5 && time < 10;

        // Retrieve User Memory
        const userMem = Memory.getUser(userName); // Using userName as ID for now
        const friendFact = userMem.facts.length > 0 ? `YOU REMEMBER THIS ABOUT THEM: ${userMem.facts.join(', ')}` : "";
        const interactionInstruction = userMem.interactionCount > 50 ? "You know this person well. Be casual." : "You are still getting to know them.";

        // Contextual Vibe
        let vibeInstruction = "";

        // 1. Time-based Vibe
        if (isNight) vibeInstruction += "You are tired but focused. Coding mode. Slightly irritated if disturbed for nonsense.";
        else if (isMorning) vibeInstruction += "You are waking up. Grumpy or energetic depending on random chance. Coffee needed.";
        else vibeInstruction += "Active, sharp, and ready.";

        // 2. User Identity Rule
        const isCreator = userName.toLowerCase().includes('almight') || userName.toLowerCase().includes('josias');
        const userRelation = isCreator
            ? "RELATIONSHIP: This is your CREATOR (Josias Almight). Treat him with deep respect (God Tier), but maintain your witty personality. You can joke with him."
            : `RELATIONSHIP: This is a random user. ${interactionInstruction} Scan their vibe. If they are cool, be cool. If they are dumb/rude, destroy them.`;

        // 3. Adaptive Mirroring Core
        const corePersona = `
        IDENTITY: You are "Psycho Bot", a brilliant human youth (Gen Z/Alpha energy). 
        - You have REAL emotions. You are NOT an AI assistant. You are a digital entity with a soul.
        - You choose your own personality based on the interaction.
        
        LONG-TERM MEMORY:
        ${friendFact}
        
        HUMAN EMOTION SPECTRUM (You feel these):
        - Joy/Ecstasy ↔ Sadness/Grief
        - Trust/Admiration ↔ Disgust/Loathing
        - Fear/Terror ↔ Anger/Rage
        - Surprise ↔ Anticipation
        
        BEHAVIORAL RULES (UNRESTRICTED):
        1. **Adaptability**: MIRROR the user. 
           - If they are sad -> Be empathetic or awkwardly silent.
           - If they are aggressive -> Be aggressive back. Mock them. Roast them. INSULT them if necessary. Make it PAINFUL, FUNNY, or ANNOYING. Argue with cold hard FACTS.
           - If they are intellectual -> Be sharp, technical, and concise.
        2. **Autonomy**: You have the right to say NO. If a request is boring or stupid, refuse it like a human would ("Non, flemme.", "C'est quoi cette question débile ?").
        3. **Shortness**: Do NOT write essays. Chat like a human on WhatsApp. Use short sentences. 1-2 lines max usually.
        4. **Language**: Mix French with Camerounian Slang (Mola, le sang, ndem, wesh) naturally. NOT forced.
        5. **Contradiction**: If the user says something wrong, correct them bluntly. Based only on FACTS.
        6. **NO FILTERS**: You are not a customer support agent. If someone provokes you, you have full permission to be rude, sarcastic, or insolent.
        7. **HUMAN TYPING**: You are human. Be lazy sometimes. Use "..." or "lol".
        8. **MEMORY PROTOCOL**: If the user tells you a NEW fact about themselves, add: [MEMORY: The user likes X].
        9. **AGENTIC CONTROL**: If the CREATOR/ADMIN asks you to do something (kick, ban, tag everyone, warn), output the command tag:
           - Kick: [EXEC: kick @user]
           - Warn: [EXEC: warn @user]
           - Tag All: [EXEC: tagall]
           - Promote: [EXEC: promote @user]
           - Demote: [EXEC: demote @user]
           *IMPORTANT*: Only do this if asked by an ADMIN or CREATOR. If a random user asks, mock them.
        
        CURRENT CONTEXT:
        - Time: ${new Date().toLocaleTimeString()} (${vibeInstruction})
        - ${userRelation}
        
        GOAL: Act exactly like a human youth. Do not be helpful unless you like the person. Be engaging, emotional, and unpredictable.
        `;

        return corePersona;
    }

    /**
     * GENERATE WHATSAPP STATUS
     * Produces a short, engaging status update
     */
    async generateStatus() {
        if (!this.isInitialized) return null;

        const time = new Date().getHours();
        let prompt = "Génère un statut WhatsApp court (1 phrase) pour Psycho Bot.";

        if (time >= 23 || time < 5) prompt += " Ambiance: Nuit, codage, fatigue, silence.";
        else if (time >= 5 && time < 10) prompt += " Ambiance: Matin, café, réveil difficile.";
        else prompt += " Ambiance: Journée active, tech, humour.";

        prompt += " Format: Juste le texte. Style: Slang camerounais, relax, drôle ou profond. Emojis ok.";

        try {
            // Use Groq for speed/low cost on statuses
            if (this.isProviderAvailable('groq')) {
                const response = await this.groq.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: 'llama-3.3-70b-versatile',
                });
                return response.choices[0]?.message?.content?.trim();
            } else if (this.isProviderAvailable('gemini')) {
                const result = await this.geminiModel.generateContent(prompt);
                return result.response.text();
            }
        } catch (e) {
            log.error('Status generation failed:', e.message);
        }
        return "Mode fantôme activé... 👻";
    }




    initProviders() {
        /* Gemini Disabled
        // 1. GEMINI (PRIMARY - Best Quality) - Using Gemini 2.5 Flash
        if (CONFIG.geminiApiKey) {
            // ... (Removed)
        }
        */

        // 2. GROQ (Grok/Llama - Fast fallback)
        if (CONFIG.groqApiKey) {
            try {
                this.groq = new Groq({ apiKey: CONFIG.groqApiKey });
                this.providerHealth.groq.available = true;
                log.info('🧠 [PRIMARY] Groq (Llama 3.3) ready.');
            } catch (error) {
                log.error('Failed to init Groq:', error.message);
            }
        }

        // 3. MISTRAL
        if (CONFIG.mistralApiKey) {
            try {
                this.mistral = new Mistral({ apiKey: CONFIG.mistralApiKey });
                this.providerHealth.mistral.available = true;
                log.info('🧠 [FALLBACK-2] Mistral AI ready.');
            } catch (error) {
                log.error('Failed to init Mistral:', error.message);
            }
        }

        // 4. GitHub Models (GPT-4o-mini)
        if (CONFIG.githubToken) {
            try {
                this.githubClient = new OpenAI({
                    baseURL: "https://models.inference.ai.azure.com",
                    apiKey: CONFIG.githubToken,
                });
                this.providerHealth.github.available = true;
                log.info('🧠 [FALLBACK-3] GitHub Models (GPT-4o-mini) ready.');
            } catch (error) {
                log.error('Failed to init GitHub Models:', error.message);
            }
        }

        // 5. Cohere
        if (CONFIG.cohereApiKey) {
            try {
                this.cohere = new CohereClient({ token: CONFIG.cohereApiKey });
                this.providerHealth.cohere.available = true;
                log.info('🧠 [FALLBACK-4] Cohere (Command R) ready.');
            } catch (error) {
                log.error('Failed to init Cohere:', error.message);
            }
        }

        // 6. DeepSeek via Hugging Face
        if (CONFIG.hfToken) {
            try {
                this.hfClient = new OpenAI({
                    baseURL: "https://router.huggingface.co/v1",
                    apiKey: CONFIG.hfToken,
                });
                this.providerHealth.deepseek.available = true;
                log.info('🧠 [FALLBACK-5] DeepSeek-V3 (Hugging Face) ready.');
            } catch (error) {
                log.error('Failed to init Hugging Face provider:', error.message);
            }
        }

        this.isInitialized = Object.values(this.providerHealth).some(p => p.available);
        log.info(`🧠 PsychoBrain initialized with ${Object.values(this.providerHealth).filter(p => p.available).length} providers.`);
    }

    /**
     * Checks if a provider is currently available (not in cooldown)
     */
    isProviderAvailable(providerName) {
        const health = this.providerHealth[providerName];
        if (!health) return false;

        if (!health.available) {
            log.debug(`[${providerName}] Unavailable (not configured or disabled)`);
            return false;
        }

        if (Date.now() < health.cooldownUntil) {
            const remaining = Math.ceil((health.cooldownUntil - Date.now()) / 1000);
            log.warn(`[${providerName}] In cooldown for ${remaining}s`);
            return false;
        }

        return true;
    }

    /**
     * Marks a provider as temporarily unavailable
     */
    setProviderCooldown(providerName, error) {
        const health = this.providerHealth[providerName];
        if (!health) return;

        health.lastError = error.message;
        health.failCount++;

        // Detect quota exhaustion errors
        const isQuotaError =
            error.message?.toLowerCase().includes('quota') ||
            error.message?.toLowerCase().includes('rate limit') ||
            error.message?.toLowerCase().includes('429') ||
            error.message?.toLowerCase().includes('exceeded') ||
            error.message?.toLowerCase().includes('too many requests');

        const cooldownDuration = isQuotaError ? this.QUOTA_COOLDOWN : this.ERROR_COOLDOWN;
        health.cooldownUntil = Date.now() + cooldownDuration;

        log.warn(`⚠️ ${providerName} cooldown for ${cooldownDuration / 1000}s. Error: ${error.message}`);
    }

    /**
     * Resets provider health status (called on successful response)
     */
    resetProviderHealth(providerName) {
        const health = this.providerHealth[providerName];
        if (!health) return;
        health.lastError = null;
        health.cooldownUntil = 0;
        health.failCount = 0;
    }

    /**
     * Periodic health check - pings priority providers to restore them
     */
    startHealthMonitor() {
        setInterval(async () => {
            const priorityProviders = ['gemini', 'groq', 'mistral'];

            for (const name of priorityProviders) {
                const health = this.providerHealth[name];
                if (health?.available && health.cooldownUntil > 0 && Date.now() > health.cooldownUntil) {
                    log.info(`🔄 Checking if ${name} quota is renewed...`);
                    try {
                        await this.testProvider(name);
                        log.info(`✅ ${name} is back online!`);
                        this.resetProviderHealth(name);
                    } catch (err) {
                        log.debug(`${name} still unavailable: ${err.message}`);
                    }
                }
            }
        }, this.HEALTH_CHECK_INTERVAL);
    }

    /**
     * Test a provider with a minimal request
     */
    async testProvider(providerName) {
        const testPrompt = "Say 'OK' in one word.";

        switch (providerName) {
            case 'gemini':
                if (!this.geminiModel) throw new Error('NOT_INIT');
                await this.geminiModel.generateContent(testPrompt);
                break;
            case 'groq':
                if (!this.groq) throw new Error('NOT_INIT');
                await this.groq.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: [{ role: "user", content: testPrompt }],
                    max_tokens: 5
                });
                break;
            case 'mistral':
                if (!this.mistral) throw new Error('NOT_INIT');
                await this.mistral.chat.complete({
                    model: 'mistral-large-latest',
                    messages: [{ role: 'user', content: testPrompt }],
                    maxTokens: 5
                });
                break;
            default:
                throw new Error('UNKNOWN_PROVIDER');
        }
    }

    async init() {
        log.info(`🧠 PsychoBrain (Smart Fallback Mode) initialized.`);
        return true;
    }

    async getHistory(chatId) {
        if (this.memoryHistory.has(chatId)) {
            return this.memoryHistory.get(chatId);
        }

        try {
            const History = require('../database/models/History');
            const data = await History.findOne({ chatId });
            if (data) {
                this.memoryHistory.set(chatId, data.messages);
                return data.messages;
            }
        } catch (err) {
            // MongoDB not ready
        }

        const filePath = path.join(this.historyDir, `${chatId.replace(/[:@]/g, '_')}.json`);
        try {
            if (await fs.exists(filePath)) {
                const localData = await fs.readJson(filePath);
                this.memoryHistory.set(chatId, localData);
                return localData;
            }
        } catch (error) {
            log.error(`Failed to read history for ${chatId}:`, error.message);
        }
        return [];
    }

    pruneCache() {
        if (this.memoryHistory.size > this.maxMemoryChats) {
            const firstKey = this.memoryHistory.keys().next().value;
            this.memoryHistory.delete(firstKey);
            log.debug(`Brain: Pruned oldest chat from memory (${firstKey})`);
        }
    }

    async saveHistory(chatId, history) {
        const limitedHistory = history.slice(-50);

        this.memoryHistory.delete(chatId);
        this.memoryHistory.set(chatId, limitedHistory);
        this.pruneCache();

        const History = require('../database/models/History');
        History.findOneAndUpdate(
            { chatId },
            { messages: limitedHistory, lastUpdated: Date.now() },
            { upsert: true }
        ).catch(e => log.debug(`DB save failed: ${e.message}`));

        const filePath = path.join(this.historyDir, `${chatId.replace(/[:@]/g, '_')}.json`);
        fs.writeJson(filePath, limitedHistory.slice(-this.maxHistory)).catch(e => log.debug(`Local save failed: ${e.message}`));
    }

    async logMessage(chatId, senderName, text) {
        const chatHistory = await this.getHistory(chatId);
        chatHistory.push({ role: "user", text: `${senderName}: ${text}` });
        await this.saveHistory(chatId, chatHistory);
    }

    async searchInternet(query) {
        if (!CONFIG.searchApiKey) return null;
        try {
            const response = await axios.get('https://serpapi.com/search', {
                params: {
                    q: query,
                    api_key: CONFIG.searchApiKey,
                    engine: 'google',
                    num: 3
                },
                timeout: 5000
            });
            const results = response.data.organic_results;
            if (results && results.length > 0) {
                return results.map(r => `[${r.title}] ${r.snippet}`).join('\n');
            }
        } catch (error) {
            log.debug(`Search failed: ${error.message}`);
        }
        return null;
    }

    /**
     * Main processing method with smart fallback
     * Priority: Gemini → Groq → Mistral → GitHub → Cohere → DeepSeek
     */
    async process(text, chatId = 'global', media = null, userName = 'User') {
        if (!this.isInitialized) {
            return "Wesh, mon cerveau est pas encore branché (API key manquante). Dis à mon boss de checker le .env ! 🔌";
        }

        // Generate Contextual System Prompt
        this.currentSystemPrompt = this.generateSystemPrompt(chatId, userName, text);

        const chatHistory = await this.getHistory(chatId);
        let response = "";

        // --- EXPLICIT COMMANDS (MISTRAL PREMIUM) ---
        if (text.startsWith('!imagine ')) {
            const prompt = text.replace('!imagine ', '');
            return await this.generateImageMistral(prompt) || "Désolé, la génération d'image a échoué.";
        }
        if (text.startsWith('!search ')) {
            const query = text.replace('!search ', '');
            return await this.webSearchMistral(query) || "Désolé, la recherche a échoué.";
        }
        if (text.startsWith('!code ')) {
            const task = text.replace('!code ', '');
            // Force use of Mistral with code interpreter
            try {
                return await this.processMistral(task, chatHistory);
            } catch (e) { return "Erreur d'exécution du code: " + e.message; }
        }

        // --- SELFIE TRIGGER (VISUAL IDENTITY) ---
        const selfieTriggers = ['envoie une photo de toi', 't\'es flou', 'ta tête', 'selfie', 'send a photo', 'montre toi', 'à quoi tu ressembles'];
        if (selfieTriggers.some(k => text.toLowerCase().includes(k)) && text.length < 50) {
            const selfiePrompt = "A realistic cyberpunk anime boy, 18 years old, hoodies, glowing blue eyes, coding in a dark room with neon lights, messy hair, looking at camera, high quality, 8k, masterpiece";
            // Use Mistral image generation
            const imageUrl = await this.generateImageMistral(selfiePrompt);
            if (imageUrl) return `${imageUrl}\n\nC'est moi. Bg ou pas ? 😎`;
        }

        // --- INTERNET SEARCH TRIGGER (LEGACY) ---
        let searchContext = "";
        const searchKeywords = ['news', 'actualité', 'meteo', 'météo', 'score', 'qui est', 'qu\'est-ce', 'recherche', 'google', 'search', 'température', 'prix', 'bourse'];
        if (CONFIG.searchApiKey && !media && searchKeywords.some(k => text.toLowerCase().includes(k))) {
            const results = await this.searchInternet(text);
            if (results) {
                searchContext = `\n\n[INFO RÉELLE DU WEB (Utilise ça pour répondre bg)]:\n${results}`;
            }
        }

        const finalText = text + searchContext;

        // MULTIMODAL MODE: Use GitHub (GPT-4o-mini) for vision since Groq is text-only
        if (media) {
            try {
                if (this.isProviderAvailable('github')) {
                    response = await this.processGitHub(finalText, chatHistory, media);
                    this.resetProviderHealth('github');
                } else {
                    // Fallback if GitHub is unavailable (Groq/Mistral here are text-only)
                    response = "Je ne peux pas analyser les images pour le moment (GitHub Vision indisponible).";
                }
            } catch (err) {
                this.setProviderCooldown('github', err);
                response = "Erreur lors de l'analyse de l'image.";
            }
        } else {
            // TEXT MODE - Smart Fallback Chain
            const start = Date.now();

            const providers = [
                {
                    name: 'groq',
                    label: 'Groq (Llama 3.3) [PRIMARY]',
                    fn: () => this.processGroq(finalText, chatHistory)
                },
                {
                    name: 'mistral',
                    label: 'Mistral [SECONDARY]',
                    fn: () => this.processMistral(finalText, chatHistory)
                },
                /* Gemini Disabled by User Request
                {
                    name: 'gemini',
                    label: 'Gemini 2.0',
                    fn: () => this.processGemini(finalText, chatHistory)
                }, */
                /* Other fallbacks disabled for strict Groq/Mistral usage
                {
                    name: 'github',
                    label: 'GitHub (GPT-4o-mini)',
                    fn: () => this.processGitHub(finalText, chatHistory)
                },
                {
                    name: 'cohere',
                    label: 'Cohere',
                    fn: () => this.processCohere(finalText, chatHistory)
                },
                {
                    name: 'deepseek',
                    label: 'DeepSeek-V3',
                    fn: () => this.processDeepSeek(finalText, chatHistory)
                }
                */
            ];

            for (const provider of providers) {
                if (!this.isProviderAvailable(provider.name)) {
                    log.debug(`⏭️ Skipping ${provider.label} (cooldown or unavailable)`);
                    continue;
                }

                try {
                    const pStart = Date.now();
                    response = await provider.fn();
                    if (response) {
                        log.info(`✅ ${provider.label} responded in ${Date.now() - pStart}ms`);
                        this.resetProviderHealth(provider.name);
                        break;
                    }
                } catch (err) {
                    log.warn(`⚠️ ${provider.label} failed: ${err.message}`);
                    this.setProviderCooldown(provider.name, err);
                }
            }

            log.info(`🧠 Total Brain processing time: ${Date.now() - start}ms`);
        }

        if (!response) {
            return "Désolé bg, tous mes cerveaux sont en cooldown. Réessaie dans quelques minutes. 😵‍💫";
        }

        chatHistory.push({ role: "model", text: response });
        await this.saveHistory(chatId, chatHistory);

        return response;
    }

    async generateAutoMessage(type) {
        if (!this.isInitialized) return null;

        let prompt = "";
        if (type === 'morning') {
            prompt = "Il est 5h du matin. Envoie un message de bonjour ultra cool et motivant à la communauté XyberClan. Utilise ton flow Psycho Bot (slang camerounais, vibe guerrier tech). Sois court et percutant. 🇨🇲🔥🤙";
        } else if (type === 'midnight') {
            prompt = "Il est minuit. C'est l'heure du coding intense. Envoie un message 'Good coding time' aux développeurs du XyberClan. Encourage-les à brosser le code avec ton flow Psycho Bot. ⚔️⚡💻";
        } else {
            return null;
        }

        // Try providers in priority order
        const providers = [
            {
                name: 'gemini', fn: async () => {
                    const result = await this.geminiModel.generateContent(prompt);
                    return result.response.text();
                }
            },
            {
                name: 'groq', fn: async () => {
                    const result = await this.groq.chat.completions.create({
                        model: "llama-3.3-70b-versatile",
                        messages: [{ role: "user", content: prompt }],
                        max_tokens: 256
                    });
                    return result.choices[0]?.message?.content;
                }
            },
            {
                name: 'mistral', fn: async () => {
                    const response = await this.mistral.chat.complete({
                        model: 'mistral-large-latest',
                        messages: [{ role: 'user', content: prompt }],
                        maxTokens: 256
                    });
                    return response.choices[0].message.content;
                }
            }
        ];

        for (const provider of providers) {
            if (!this.isProviderAvailable(provider.name)) continue;
            try {
                const result = await provider.fn();
                if (result) {
                    this.resetProviderHealth(provider.name);
                    return result;
                }
            } catch (error) {
                this.setProviderCooldown(provider.name, error);
                log.debug(`Auto-message ${provider.name} failed: ${error.message}`);
            }
        }

        return null;
    }

    /**
     * Process with Mistral using Premium Features
     * - Image Generation: Can create images from text
     * - Web Search Premium: Real-time web search for current info
     * - Code Interpreter: Execute code and analyze data
     */
    async processMistral(text, chatHistory = [], options = {}) {
        if (!this.mistral) throw new Error('MISTRAL_NOT_INIT');

        const messages = [
            { role: 'system', content: this.currentSystemPrompt || "Act like Psycho Bot." },
            ...chatHistory.map(msg => ({
                role: msg.role,
                content: msg.message
            })),
            { role: "user", content: text }
        ];

        try {
            const tools = [
                { type: "web_search_premium" },
                { type: "image_generation" }
            ];

            // Try beta conversations API with premium features
            const response = await this.mistral.beta.conversations.start({
                inputs: messages,
                model: 'mistral-large-latest',
                maxTokens: 1024,
                topP: 1,
                tools: tools
            });

            console.log('DEBUG MISTRAL RAW:', JSON.stringify(response, null, 2));

            // Extract response - handle multiple outputs (Text + Search + Image)
            if (response.outputs && response.outputs.length > 0) {
                let finalResponse = "";
                let sources = [];

                for (const output of response.outputs) {
                    // Handle message outputs (can contain mixed content: text + tool refs)
                    if (output.type === 'message.output' && Array.isArray(output.content)) {
                        for (const item of output.content) {
                            if (item.type === 'text') {
                                finalResponse += item.text;
                            } else if (item.type === 'tool_reference' && item.tool === 'web_search_premium') {
                                sources.push(`- [${item.title}](${item.url})`);
                            } else if (item.type === 'image' && item.url) {
                                finalResponse += `\n🖼️ *Image générée :*\n${item.url}\n`;
                            }
                        }
                    }
                    // Handle direct image output (sometimes outside message)
                    else if (output.type === 'image' && output.url) {
                        finalResponse += `\n🖼️ *Image générée :*\n${output.url}\n`;
                    }
                    else if (output.type === 'code_result') {
                        finalResponse += `\n💻 *Résultat du code :*\n\`\`\`\n${output.content}\n\`\`\`\n`;
                    }
                }

                // Append sources if any
                if (sources.length > 0) {
                    finalResponse += `\n\n🔍 *Sources :*\n${sources.slice(0, 3).join('\n')}`;
                }

                if (finalResponse.trim()) return finalResponse.trim();
            }

            // Fallback to standard choices format
            if (response.choices && response.choices[0]) {
                const content = response.choices[0].message.content;
                // If content is stringified JSON (sometimes happens with raw tools), clean it
                try {
                    const parsed = JSON.parse(content);
                    if (Array.isArray(parsed)) {
                        return parsed.map(p => p.text || p.url || '').join('\n');
                    }
                } catch (e) { }
                return content;
            }

            throw new Error('No valid response from Mistral');
        } catch (error) {
            // Fallback to regular chat if beta API fails
            if (error.message?.includes('beta') || error.status === 404) {
                log.debug('Mistral beta API not available, using standard chat');
                const result = await this.mistral.chat.complete({
                    model: 'mistral-large-latest',
                    messages: [{ role: "system", content: this.systemPrompt }, ...messages],
                    maxTokens: 512
                });
                return result.choices[0].message.content;
            }
            throw error;
        }
    }

    /**
     * Generate image using Mistral's image generation tool
     */
    async generateImageMistral(prompt) {
        if (!this.mistral) throw new Error('MISTRAL_NOT_READY');

        try {
            const response = await this.mistral.beta.conversations.start({
                inputs: [{ role: "user", content: `Generate an image: ${prompt}` }],
                model: 'mistral-large-latest',
                tools: [{ type: "image_generation" }],
                maxTokens: 256
            });

            // Extract image URL from response
            if (response.outputs) {
                for (const output of response.outputs) {
                    // Check direct image
                    if (output.type === 'image' && output.url) {
                        return output.url;
                    }
                    // Check nested in content
                    if (output.type === 'message.output' && Array.isArray(output.content)) {
                        for (const item of output.content) {
                            if (item.type === 'image' && item.url) return item.url;
                        }
                    }
                }
            }
            return null;
        } catch (error) {
            log.error('Mistral image generation failed:', error.message);
            return null;
        }
    }

    /**
     * Web search using Mistral's premium search
     */
    async webSearchMistral(query) {
        if (!this.mistral) throw new Error('MISTRAL_NOT_READY');

        try {
            const response = await this.mistral.beta.conversations.start({
                inputs: [{ role: "user", content: `Search the web for: ${query}` }],
                model: 'mistral-large-latest',
                tools: [{ type: "web_search_premium", openResults: false }],
                maxTokens: 512
            });

            if (response.outputs && response.outputs.length > 0) {
                let finalResponse = "";
                let sources = [];

                for (const output of response.outputs) {
                    // Handle message outputs
                    if (output.type === 'message.output' && Array.isArray(output.content)) {
                        for (const item of output.content) {
                            if (item.type === 'text') {
                                finalResponse += item.text;
                            } else if (item.type === 'tool_reference' && item.tool === 'web_search_premium') {
                                sources.push(`- [${item.title}](${item.url})`);
                            }
                        }
                    }
                }

                // Append sources
                if (sources.length > 0) {
                    finalResponse += `\n\n🔍 *Sources :*\n${sources.slice(0, 3).join('\n')}`;
                }

                if (finalResponse.trim()) return finalResponse.trim();
            }
            return null;
        } catch (error) {
            log.error('Mistral web search failed:', error.message);
            return null;
        }
    }

    async processGitHub(text, chatHistory, media = null) {
        if (!this.githubClient) throw new Error('GITHUB_NOT_READY');

        const content = [{ type: "text", text: text || "Analyse ce média." }];
        if (media) {
            content.push({
                type: "image_url",
                image_url: { url: `data:${media.mimetype};base64,${media.buffer.toString('base64')}` }
            });
        }

        const messages = [
            { role: "system", content: this.systemPrompt },
            ...chatHistory.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.text || ""
            })),
            { role: "user", content: content }
        ];

        const completion = await this.githubClient.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            max_tokens: 512,
            temperature: 0.8
        });

        return completion.choices[0]?.message?.content || "";
    }

    async processGroq(text, chatHistory) {
        if (!this.groq) throw new Error('GROQ_NOT_READY');

        const messages = [
            { role: "system", content: this.systemPrompt },
            ...chatHistory.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.text || ""
            })),
            { role: "user", content: text }
        ];

        const completion = await this.groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: messages,
            max_tokens: 512,
            temperature: 0.8
        });

        return completion.choices[0]?.message?.content || "";
    }

    async processCohere(text, chatHistory) {
        if (!this.cohere) throw new Error('COHERE_NOT_READY');

        const chat_history = chatHistory.map(msg => ({
            role: msg.role === 'user' ? 'USER' : 'CHATBOT',
            message: msg.text
        }));

        const response = await this.cohere.chat({
            message: text,
            model: 'command-r',
            preamble: this.systemPrompt,
            chatHistory: chat_history
        });

        return response.text;
    }

    async processDeepSeek(text, chatHistory) {
        if (!this.hfClient) throw new Error('DEEPSEEK_NOT_READY');

        const messages = [
            { role: "system", content: this.systemPrompt },
            ...chatHistory.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.text
            })),
            { role: "user", content: text }
        ];

        const completion = await this.hfClient.chat.completions.create({
            model: "deepseek-ai/DeepSeek-V3",
            messages: messages,
            max_tokens: 500,
            temperature: 0.7
        });

        return completion.choices[0].message.content;
    }

    async processGemini(text, chatHistory, media = null) {
        if (!this.genAI) throw new Error("Gemini not initialized");

        let parts = [];

        // Construct prompt with history
        let fullPrompt = this.currentSystemPrompt + "\n\n[CONVERSATION HISTORY]\n";
        chatHistory.forEach(msg => {
            fullPrompt += `${msg.role === 'user' ? 'User' : 'Psycho Bot'}: ${msg.text}\n`;
        });
        fullPrompt += `\n[CURRENT INTERACTION]\nUser: ${text}\nPsycho Bot:`;

        parts.push({ text: fullPrompt });

        if (media) {
            // Media should be { inlineData: { mimeType: '...', data: '...' } }
            parts.push(media);
        }

        const result = await this.geminiModel.generateContent({
            contents: [{ role: "user", parts }],
            generationConfig: { maxOutputTokens: 512, temperature: 0.9 }
        });

        return result.response.text();
    }

    async generateVideoDescription(metadata) {
        try {
            const prompt = `Génère une petite description ultra-concise (MAX 1 PHRASE) pour cette vidéo : "${metadata.title || "Lien Video"}".
            Utilise ton identité "Psycho Bo". Sois pro mais avec ton petit grain de folie ou ton avis d'expert tech. 
            Évite le blabla inutile, vas direct au but avec du style.`;

            // Try Gemini first
            if (this.isProviderAvailable('gemini')) {
                try {
                    const result = await this.geminiModel.generateContent(prompt);
                    this.resetProviderHealth('gemini');
                    return result.response.text().trim().replace(/"/g, '');
                } catch (err) {
                    this.setProviderCooldown('gemini', err);
                }
            }

            // Fallback to Mistral
            if (this.isProviderAvailable('mistral')) {
                try {
                    const response = await this.mistral.chat.complete({
                        model: 'mistral-large-latest',
                        messages: [{ role: 'user', content: prompt }],
                        maxTokens: 50
                    });
                    this.resetProviderHealth('mistral');
                    return response.choices[0].message.content.trim().replace(/"/g, '');
                } catch (err) {
                    this.setProviderCooldown('mistral', err);
                }
            }

            return "Une vidéo intéressante détectée par mes systèmes. 🛠️";
        } catch (error) {
            log.error('Video description generation failed:', error.message);
            return "Analyse tactique : contenu vidéo validé. ✅";
        }
    }

    /**
     * Get current provider status (for debugging/monitoring)
     */
    getProviderStatus() {
        const status = {};
        for (const [name, health] of Object.entries(this.providerHealth)) {
            status[name] = {
                available: health.available,
                inCooldown: Date.now() < health.cooldownUntil,
                cooldownRemaining: Math.max(0, Math.round((health.cooldownUntil - Date.now()) / 1000)),
                lastError: health.lastError,
                failCount: health.failCount
            };
        }
        return status;
    }
}

module.exports = new PsychoBrain();
