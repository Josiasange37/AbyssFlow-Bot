const fs = require('fs-extra');
const path = require('path');

class MemoryManager {
    constructor() {
        this.memoryPath = path.join(process.cwd(), 'data', 'memory.json');
        this.longTermPath = path.join(process.cwd(), 'data', 'longterm_memory.json');
        this.memory = { users: {} };
        this.longTerm = [];
        this.init();
    }

    init() {
        try {
            if (fs.existsSync(this.memoryPath)) {
                this.memory = fs.readJsonSync(this.memoryPath);
            } else {
                fs.ensureFileSync(this.memoryPath);
                fs.writeJsonSync(this.memoryPath, this.memory);
            }

            if (fs.existsSync(this.longTermPath)) {
                this.longTerm = fs.readJsonSync(this.longTermPath);
            } else {
                fs.ensureFileSync(this.longTermPath);
                fs.writeJsonSync(this.longTermPath, this.longTerm);
            }
        } catch (error) {
            console.error('Memory init failed:', error);
        }
    }

    // --- USER FACT MEMORY ---
    getUser(userId) {
        if (!this.memory.users[userId]) {
            this.memory.users[userId] = {
                facts: [],
                vibe: 'neutral',
                lastSeen: Date.now(),
                interactionCount: 0
            };
        }
        return this.memory.users[userId];
    }

    updateUser(userId, data) {
        const user = this.getUser(userId);
        this.memory.users[userId] = { ...user, ...data, lastSeen: Date.now() };
        this.save();
    }

    addFact(userId, fact) {
        const user = this.getUser(userId);
        if (!user.facts.includes(fact)) {
            user.facts.push(fact);
            if (user.facts.length > 15) user.facts.shift();
            this.save();
        }
    }

    // --- ASSOCIATIVE LONG-TERM MEMORY (Keyword Base) ---
    async storeLongTerm(text, response, speaker) {
        // Only store messages that look "memorable" (length > 20 or contains specific intent)
        if (text.length < 20 && !text.includes('?')) return;

        const entry = {
            t: Date.now(),
            u: speaker,
            m: text.substring(0, 500),
            r: response.substring(0, 500)
        };

        this.longTerm.push(entry);

        // Keep last 200 significant interactions
        if (this.longTerm.length > 200) this.longTerm.shift();
        this.saveLongTerm();
    }

    retrieveRelevant(query) {
        if (!query || this.longTerm.length === 0) return "";

        const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        if (words.length === 0) return "";

        // Find matches (simple keyword intersection)
        const matches = this.longTerm
            .filter(entry => words.some(w => entry.m.toLowerCase().includes(w)))
            .slice(-3); // Get last 3 relevant

        if (matches.length === 0) return "";

        return "\n[MÉMOIRE ASSOCIATIVE - SOUVENIRS PERTINENTS]:\n" +
            matches.map(m => `- Le ${new Date(m.t).toLocaleDateString()}: "${m.m}" -> Réponse: "${m.r}"`).join('\n');
    }

    save() {
        try {
            fs.writeJsonSync(this.memoryPath, this.memory, { spaces: 2 });
        } catch (error) {
            console.error('Memory save failed:', error);
        }
    }

    saveLongTerm() {
        try {
            fs.writeJsonSync(this.longTermPath, this.longTerm, { spaces: 2 });
        } catch (error) {
            console.error('LongTerm Memory save failed:', error);
        }
    }
}

module.exports = new MemoryManager();
