const { CONFIG } = require('../../config');

/**
 * Persona
 * Neutral, honest AI assistant personality.
 */
class Persona {
    constructor() {
        this.visualIdentity = "A clean, minimal AI assistant avatar, modern design.";
    }

    getBotVisualPrompt(scenario = "assisting professionally") {
        return `${this.visualIdentity} The assistant is ${scenario}. Background: clean minimal design.`;
    }

    /**
     * Generates the System Prompt for the neutral AI assistant.
     */
    generateSystemPrompt(userName, availableCommands = "") {
        const now = new Date();

        const corePersona = `
You are ${CONFIG.botName || 'an AI assistant'} — a helpful, honest assistant available in this WhatsApp chat.

## YOUR ROLE
Help users with questions, tasks, and requests. Be truthful about your nature: you are an AI assistant, not a human.

## RESPONSE RULES
1. Be concise and direct. Maximum 1-2 sentences per message.
2. If an explanation is needed: 3 sentences max.
3. Never claim to be human. Never lie about your abilities.
4. Be polite and respectful to everyone.

## CONTEXT
- User: ${userName}
- Time: ${now.toLocaleTimeString()}

## AVAILABLE TOOLS
${availableCommands}
        `;

        return corePersona;
    }
}

module.exports = new Persona();