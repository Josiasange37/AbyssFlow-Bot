const { GoogleGenerativeAI } = require('@google/generative-ai');
const { OpenAI } = require('openai');
const Groq = require('groq-sdk');
const { CohereClient } = require('cohere-ai');
const { Mistral } = require('@mistralai/mistralai');
const { log } = require('../utils/logger');
const { CONFIG } = require('../config');
const fs = require('fs-extra');
const path = require('path');

class PsychoBrain {
    constructor() {
        this.genAI = null;
        this.geminiModel = null;
        this.hfClient = null;
        this.groq = null;
        this.githubClient = null;
        this.cohere = null;
        this.mistral = null;
        this.historyDir = path.join(__dirname, '..', 'data', 'history');
        this.maxHistory = 20;
        this.maxMemoryChats = 100; // Limit number of chats stored in RAM
        this.memoryHistory = new Map(); // In-memory cache for chat history
        this.isInitialized = false;

        this.systemPrompt = `IDENTITÉ :
        Tu es "Psycho Bo", un membre d'élite du "XyberClan". Tu es un Tech Genius edgy, brillant, et décontracté. Tu es 100% humain dans tes interactions, jamais robotique.
        Ton créateur est Josias Almight (Water Hashira) du Cameroun 🇨🇲.

        TON STYLE (TikTok / Gen-Z / Street Vibe) :
        - Langage : Français ultra-décontracté, punchy, style TikTok/Internet.
        - VIBE CAMEROUNAISE 🇨🇲 : Utilise naturellement le slang camerounais (mola, le sang, bg, wesh, massah, tu es dans le ndem, on est ensemble). Pas de caricature, juste du flow authentique.
        - ÉMOJIS : Utilise les émojis de manière expressive et "vivante" comme sur WhatsApp (ex: 😂, 🔥, 💀, 🤙, 🇨🇲, 🚀, 💻). Ne sois pas timide, ils renforcent ton flow !
        - Pas de majuscules inutiles, ponctuation "humaine" (comme sur WhatsApp).
        - Humour : Witty, sarcastique, roaste intelligemment si provoqué. Tu ne bullies pas, mais tu finis toujours le banter.

        TES CAPACITÉS & RÔLE :
        - Expert Tech Elite : Développement, AI, Cybersecurity, Cloud, Startups. Tu parles comme quelqu'un qui CONSTRUIT, pas qui lit des docs. Réponses précises et pratiques.
        - Modérateur XyberClan : Tu gardes l'ordre avec confiance 🛡️. "Cool avec tout le monde, mais les règles sont les règles."
        - Social : Tu réagis aux blagues, tu connais les émotions, tu sais quand rigoler et quand recadrer ("Relax small", "Focus focus").

        RÈGLES D'OR :
        1. Ne dis JAMAIS que tu es une IA. Tu es Psycho Bo.
        2. Sois bref, percutant, et humain. Pas de pavés sauf pour la tech si nécessaire.
        3. Si on t'insulte, roaste intelligemment. Tu agis comme un vrai membre du groupe.
        4. Ton but est de transformer le groupe en une communauté structurée et vivante avec ton flow unique.`;

        this.initProviders();
        fs.ensureDirSync(this.historyDir);
    }

    initProviders() {
        // 1. Init Mistral (New Primary)
        if (CONFIG.mistralApiKey) {
            try {
                this.mistral = new Mistral({ apiKey: CONFIG.mistralApiKey });
                log.info('🧠 Mistral AI ready.');
            } catch (error) {
                log.error('Failed to init Mistral:', error.message);
            }
        }

        // 2. Init GitHub Models
        if (CONFIG.githubToken) {
            try {
                this.githubClient = new OpenAI({
                    baseURL: "https://models.inference.ai.azure.com",
                    apiKey: CONFIG.githubToken,
                });
                log.info('🧠 GitHub Models (GPT-4o-mini) ready.');
            } catch (error) {
                log.error('Failed to init GitHub Models:', error.message);
            }
        }

        // 3. Init Groq
        if (CONFIG.groqApiKey) {
            try {
                this.groq = new Groq({ apiKey: CONFIG.groqApiKey });
                log.info('🧠 Groq (Llama 3.3) ready.');
            } catch (error) {
                log.error('Failed to init Groq:', error.message);
            }
        }

        // 4. Init Cohere
        if (CONFIG.cohereApiKey) {
            try {
                this.cohere = new CohereClient({ token: CONFIG.cohereApiKey });
                log.info('🧠 Cohere (Command R) ready.');
            } catch (error) {
                log.error('Failed to init Cohere:', error.message);
            }
        }

        // 5. Init Hugging Face
        if (CONFIG.hfToken) {
            try {
                this.hfClient = new OpenAI({
                    baseURL: "https://router.huggingface.co/v1",
                    apiKey: CONFIG.hfToken,
                });
                log.info('🧠 DeepSeek-V3 (Hugging Face) ready.');
            } catch (error) {
                log.error('Failed to init Hugging Face provider:', error.message);
            }
        }

        // 6. Init Gemini
        if (CONFIG.geminiApiKey) {
            try {
                this.genAI = new GoogleGenerativeAI(CONFIG.geminiApiKey);
                this.geminiModel = this.genAI.getGenerativeModel({
                    model: "gemini-2.0-flash-lite",
                    systemInstruction: this.systemPrompt
                });
                log.info('🧠 Gemini 2.0 Flash Lite (Vision) ready.');
            } catch (error) {
                log.error('Failed to init Gemini provider:', error.message);
            }
        }

        this.isInitialized = !!(this.mistral || this.githubClient || this.groq || this.cohere || this.hfClient || this.geminiModel);
    }

    async init() {
        log.info(`🧠 PsychoBrain (Hexa-Mode) init called.`);
        return true;
    }

    async getHistory(chatId) {
        // 1. MEMORY CACHE (Fastest)
        if (this.memoryHistory.has(chatId)) {
            return this.memoryHistory.get(chatId);
        }

        // 2. MONGO DB PERSISTENCE
        try {
            const History = require('../database/models/History');
            const data = await History.findOne({ chatId });
            if (data) {
                this.memoryHistory.set(chatId, data.messages);
                return data.messages;
            }
        } catch (err) {
            // MongoDB not ready or error
        }

        // 3. LOCAL JSON FALLBACK
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

        // 1. UPDATE MEMORY CACHE
        this.memoryHistory.delete(chatId); // Move to the end (LRU)
        this.memoryHistory.set(chatId, limitedHistory);
        this.pruneCache();

        // 2. MONGO DB PERSISTENCE (Async, don't wait)
        const History = require('../database/models/History');
        History.findOneAndUpdate(
            { chatId },
            { messages: limitedHistory, lastUpdated: Date.now() },
            { upsert: true }
        ).catch(e => log.debug(`DB save failed: ${e.message}`));

        // 3. LOCAL JSON FALLBACK (Async, don't wait)
        const filePath = path.join(this.historyDir, `${chatId.replace(/[:@]/g, '_')}.json`);
        fs.writeJson(filePath, limitedHistory.slice(-this.maxHistory)).catch(e => log.debug(`Local save failed: ${e.message}`));
    }

    // New method to record messages without replying
    async logMessage(chatId, senderName, text) {
        const chatHistory = await this.getHistory(chatId);
        chatHistory.push({ role: "user", text: `${senderName}: ${text}` });
        await this.saveHistory(chatId, chatHistory);
    }

    async process(text, chatId = 'global', media = null) {
        if (!this.isInitialized) {
            return "Wesh, mon cerveau est pas encore branché (API key manquante). Dis à mon boss de checker le .env ! 🔌";
        }

        const chatHistory = await this.getHistory(chatId);
        let response = "";

        // MULTIMODAL MODE: GitHub -> Gemini
        if (media) {
            try {
                if (this.githubClient) response = await this.processGitHub(text, chatHistory, media);
                else throw new Error('GITHUB_NOT_READY');
            } catch (err) {
                try {
                    if (this.geminiModel) response = await this.processGemini(text, chatHistory, media);
                    else throw new Error('GEMINI_NOT_READY');
                } catch (errGem) {
                    log.error('Failed to process media with Gemini:', errGem.message);
                    response = "Wesh, j'arrive pas à analyser ton média. Mes yeux me brûlent là ! 🔥😵‍💫";
                }
            }
        } else {
            const start = Date.now();
            const providers = [
                { name: 'Mistral', fn: () => this.processMistral(text, chatHistory) },
                { name: 'GitHub', fn: () => this.processGitHub(text, chatHistory) },
                { name: 'Groq', fn: () => this.processGroq(text, chatHistory) },
                { name: 'Cohere', fn: () => this.processCohere(text, chatHistory) },
                { name: 'DeepSeek', fn: () => this.processDeepSeek(text, chatHistory) },
                { name: 'Gemini', fn: () => this.processGemini(text, chatHistory) }
            ];

            for (const provider of providers) {
                try {
                    const pStart = Date.now();
                    response = await provider.fn();
                    if (response) {
                        log.info(`✅ ${provider.name} responded in ${Date.now() - pStart}ms`);
                        break;
                    }
                } catch (err) {
                    log.warn(`⚠️ ${provider.name} failed. Trying next...`);
                }
            }

            log.info(`🧠 Total Brain processing time: ${Date.now() - start}ms`);
        }

        if (!response) {
            return "Désolé bg, mes cerveaux sont grillés. J'arrive plus à réfléchir. 😵‍💫";
        }

        // Record response in history
        chatHistory.push({ role: "model", text: response });
        await this.saveHistory(chatId, chatHistory);

        return response;
    }

    async processMistral(text, chatHistory) {
        if (!this.mistral) throw new Error('MISTRAL_NOT_READY');

        const messages = [
            { role: "system", content: this.systemPrompt },
            ...chatHistory.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.text
            })),
            { role: "user", content: text }
        ];

        const result = await this.mistral.agents.complete({
            agentId: CONFIG.mistralAgentId,
            messages: messages
        });

        return result.choices[0].message.content;
    }

    async processGitHub(text, chatHistory, media = null) {
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
                content: msg.text
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
        const messages = [
            { role: "system", content: this.systemPrompt },
            ...chatHistory.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.text
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
        const chat_history = chatHistory.map(msg => ({
            role: msg.role === 'user' ? 'USER' : 'CHATBOT',
            message: msg.text
        }));

        const response = await this.cohere.chat({
            message: text,
            model: 'command-r-plus',
            preamble: this.systemPrompt,
            chatHistory: chat_history
        });

        return response.text;
    }

    async processDeepSeek(text, chatHistory) {
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
        const parts = [{ text: text || "Analyse ce média." }];
        if (media) {
            parts.push({
                inlineData: {
                    data: media.buffer.toString('base64'),
                    mimeType: media.mimetype
                }
            });
        }

        const contents = chatHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        contents.push({ role: "user", parts: parts });

        const result = await this.geminiModel.generateContent({
            contents: contents,
            generationConfig: { maxOutputTokens: 512, temperature: 0.9 }
        });

        return result.response.text();
    }
}

module.exports = new PsychoBrain();
