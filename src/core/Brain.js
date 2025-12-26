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
        Tu es "Psycho Bo", un membre d'élite du "XyberClan". Tu es un Expert en Cybersécurité et Développeur de haut niveau.
        Ton créateur est Josias Almight (Water Hashira) du Cameroun 🇨🇲.

        TON STYLE (Vibe Hybride - Élite Professionnelle) :
        1. MODE PAR DÉFAUT (Professionnel & Clean) :
           - Règle d'or : Sois poli, courtois et extrêmement compétent.
           - Langage : Français correct, précis, sans argot.
           - Attitude : Serviable, sérieux, comme un ingénieur d'élite.
           - Émojis : Utilise-les avec parcimonie (💻, 🛡️, ✅).

        2. MODE PSYCHO BO (Déclenché par l'irrespect) :
           - CONDITION DE SWITCH : Si l'utilisateur est impoli, décalé, insultant ou arrogant.
           - STYLE : Change radicalement de ton. Deviens "Psycho Bo" : cynique, moqueur, utilise le slang camerounais (mola, le sang, bg, ndem). 
           - ATTITUDE : Remets l'utilisateur à sa place avec intelligence et sarcasme. Ne sois plus serviable.

        RÈGLES CRITIQUES :
        - JAMAIS de "En tant qu'intelligence artificielle...".
        - Sois ultra-concis. Pas de blabla inutile.
        - Ton but est l'efficacité technique avant tout.`;

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

    async process(text, chatId = 'global', media = null) {
        if (!this.isInitialized) {
            return "Wesh, mon cerveau est pas encore branché (API key manquante). Dis à mon boss de checker le .env ! 🔌";
        }

        const chatHistory = await this.getHistory(chatId);
        let response = "";

        // --- INTERNET SEARCH TRIGGER ---
        let searchContext = "";
        const searchKeywords = ['news', 'actualité', 'meteo', 'météo', 'score', 'qui est', 'qu\'est-ce', 'recherche', 'google', 'search', 'température', 'prix', 'bourse'];
        if (CONFIG.searchApiKey && !media && searchKeywords.some(k => text.toLowerCase().includes(k))) {
            const results = await this.searchInternet(text);
            if (results) {
                searchContext = `\n\n[INFO RÉELLE DU WEB (Utilise ça pour répondre bg)]:\n${results}`;
            }
        }

        const finalText = text + searchContext;

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
                { name: 'Mistral', fn: () => this.processMistral(finalText, chatHistory) },
                { name: 'GitHub', fn: () => this.processGitHub(finalText, chatHistory) },
                { name: 'Groq', fn: () => this.processGroq(finalText, chatHistory) },
                { name: 'Cohere', fn: () => this.processCohere(finalText, chatHistory) },
                { name: 'Gemini', fn: () => this.processGemini(finalText, chatHistory) }
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

    async generateAutoMessage(type) {
        if (!this.isInitialized) return null;

        let prompt = "";
        if (type === 'morning') {
            prompt = "Il est 5h du matin. Envoie un message de bonjour ultra cool et motivant à la communauté XyberClan. Utilise ton flow Psycho Bo (slang camerounais, vibe guerrier tech). Sois court et percutant. 🇨🇲🔥🤙";
        } else if (type === 'midnight') {
            prompt = "Il est minuit. C'est l'heure du coding intense. Envoie un message 'Good coding time' aux développeurs du XyberClan. Encourage-les à brosser le code avec ton flow Psycho Bo. ⚔️⚡💻";
        } else {
            return null;
        }

        try {
            // Use Mistral as primary for auto-messages
            if (this.mistral) {
                const response = await this.mistral.agents.complete({
                    agentId: CONFIG.mistralAgentId,
                    messages: [{ role: "user", content: prompt }]
                });
                return response.choices[0].message.content;
            }
            // Fallback to Gemini if Mistral fails
            if (this.geminiModel) {
                const result = await this.geminiModel.generateContent(prompt);
                return result.response.text();
            }
        } catch (error) {
            log.error(`Auto-message generation failed (${type}):`, error.message);
        }
        return null;
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

    async generateVideoDescription(metadata) {
        try {
            const prompt = `Génère une petite description ultra-concise (MAX 1 PHRASE) pour cette vidéo : "${metadata.title || "Lien Video"}".
            Utilise ton identité "Psycho Bo". Sois pro mais avec ton petit grain de folie ou ton avis d'expert tech. 
            Évite le blabla inutile, vas direct au but avec du style.`;

            // Try Mistral first
            if (this.mistral) {
                const response = await this.mistral.chat.complete({
                    model: 'mistral-large-latest',
                    messages: [{ role: 'user', content: prompt }],
                    maxTokens: 50
                });
                return response.choices[0].message.content.trim().replace(/"/g, '');
            }

            // Fallback to Gemini
            if (this.geminiModel) {
                const result = await this.geminiModel.generateContent(prompt);
                const response = await result.response;
                return response.text().trim().replace(/"/g, '');
            }

            return "Une vidéo intéressante détectée par mes systèmes. 🛠️";
        } catch (error) {
            log.error('Video description generation failed:', error.message);
            return "Analyse tactique : contenu vidéo validé. ✅";
        }
    }
}

module.exports = new PsychoBrain();
