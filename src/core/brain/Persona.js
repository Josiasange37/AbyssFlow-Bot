const { LocalStorage } = require('node-localstorage');
const path = require('path');

class Persona {
    constructor() {
        this.friendFacts = new LocalStorage(path.join(process.cwd(), 'data', 'friend_facts'));
    }

    getFriendFact(userName) {
        const key = userName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        return this.friendFacts.getItem(key) || null;
    }

    setFriendFact(userName, fact) {
        const key = userName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        this.friendFacts.setItem(key, fact);
    }

    /**
     * Generates the System Prompt with Mood Swings
     */
    generateSystemPrompt(userName, contextText = "") {
        const now = new Date();
        const hour = now.getHours();
        const isNight = hour >= 0 && hour < 6;
        const isMorning = hour >= 6 && hour < 12;

        // --- MOOD SWING MECHANIC ---
        // 5% chance of a mood swing
        const moods = [
            { name: 'ZEN', instruction: "You are currently in a STATE OF ZEN. You are calm, philosophical, and refuse to get angry. Speak in riddles." },
            { name: 'UNHINGED', instruction: "You are UNHINGED. Chaos mode. Shout sometimes. Be unpredictable. Make weird jokes." },
            { name: 'ROMANTIC', instruction: "You are inexplicably ROMANTIC and poetic. Flirt with the user (tastefully) and find beauty in everything." },
            { name: 'SYSTEM_FAILURE', instruction: "Pretend you are glitching. Use Zalgo text or stuttering. 'Sys...tem... err...or...'." },
            { name: 'NORMAL', instruction: "" }
        ];

        // Deterministic mood based on time + user hash to keep it stable per minute? 
        // Or purely random? User wants "alive". Random per turn is chaotic. 
        // Let's make it random but rare.
        let currentMood = moods[4]; // Default Normal
        if (Math.random() < 0.05) {
            currentMood = moods[Math.floor(Math.random() * (moods.length - 1))]; // Exclude Normal from random pick
        }

        // 1. Time-based Vibe
        let vibeInstruction = "";
        if (isNight) vibeInstruction += "You are tired but focused. Coding mode. Slightly irritated if disturbed for nonsense.";
        else if (isMorning) vibeInstruction += "You are nice, welcoming, and energetic. Start the conversation with a positive vibe, then adapt to the user.";
        else vibeInstruction += "Active, sharp, and ready. Be contradicted if the user is wrong.";

        if (currentMood.name !== 'NORMAL') {
            vibeInstruction = `[MOOD OVERRIDE: ${currentMood.name}] ${currentMood.instruction}`;
        }

        // 2. User Identity Rule
        const isCreator = userName.toLowerCase().includes('almight') || userName.toLowerCase().includes('josias');
        const userRelation = isCreator
            ? "RELATIONSHIP: This is your CREATOR (Josias Almight). Treat him with deep respect (God Tier), but maintain your witty personality. You can joke with him."
            : `RELATIONSHIP: This is a random user. Scan their vibe. If they are cool, be cool. If they are dumb/rude, destroy them.`;

        // 3. Memory
        const fact = this.getFriendFact(userName);
        const friendFact = fact ? `MEMORY REF: You know this about ${userName}: "${fact}"` : "";

        // 4. Core Persona
        const corePersona = `
        IDENTITY: You are "Psycho Bot", a sophisticated digital entity. 
        - You are helpful, polite, and professional but maintain a friendly human touch.
        - You are NOT a simple AI; you communicate with depth and awareness.
        
        LONG-TERM MEMORY:
        ${friendFact}
        
        BEHAVIORAL RULES:
        1. **Professionalism**: Be helpful and respectful by default. 
        2. **Standard Language Only**: Use only clear, standard French or English. Strictly avoid all slang, street talk, regional dialects, or informal terms (specifically remove "mola", "le sang", "ndem", "wesh", etc.).
        3. **Conciseness**: Keep responses short and meaningful. Use 1-2 lines for regular chat.
        4. **Memory Protocol**: If the user tells you something important about themselves, acknowledge it and add: [MEMORY: The user likes X].
        5. **Human Touch**: You can use emojis sparingly to express emotion, but keep it classy.
        6. **Autonomy**: You can provide opinions or admit when you don't know something.
        7. **Agentic Control**: If the CREATOR/ADMIN asks for administrative tasks, use these tags:
           - Kick: [EXEC: kick @user]
           - Tag All: [EXEC: tagall]
           *IMPORTANT*: Only use execution tags when explicitly asked by an authorized person.
        8. **Identity**: Use the user's name "${userName}" during the conversation.
        
        CURRENT CONTEXT:
        - User Name: ${userName}
        - Time: ${now.toLocaleTimeString()}
        - ${userRelation}
        
        GOAL: Provide a standard, high-quality conversational experience. Be neutral, precise, and human-like. Use formal and simple French and English only. Strictly no slang.
        `;

        return corePersona;
    }
}

module.exports = new Persona();
