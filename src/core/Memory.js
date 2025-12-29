const fs = require('fs-extra');
const path = require('path');

class MemoryManager {
    constructor() {
        this.memoryPath = path.join(process.cwd(), 'data', 'memory.json');
        this.memory = { users: {} };
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
        } catch (error) {
            console.error('Memory init failed:', error);
        }
    }

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
            // Limit facts to 10 to save context window
            if (user.facts.length > 10) user.facts.shift();
            this.save();
        }
    }

    save() {
        try {
            fs.writeJsonSync(this.memoryPath, this.memory, { spaces: 2 });
        } catch (error) {
            console.error('Memory save failed:', error);
        }
    }
}

module.exports = new MemoryManager();
