require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const { Mistral } = require('@mistralai/mistralai');

async function testProviders() {
    console.log("🔍 Testing AI Providers...");

    // 1. GEMINI
    if (process.env.GEMINI_API_KEY) {
        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const result = await model.generateContent("Hello");
            console.log("✅ GEMINI: Success");
        } catch (e) {
            console.error("❌ GEMINI: Failed", e.message);
        }
    } else {
        console.log("⚠️ GEMINI: No Key");
    }

    // 2. GROQ
    if (process.env.GROQ_API_KEY) {
        try {
            const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
            const completion = await groq.chat.completions.create({
                messages: [{ role: "user", content: "Hello, who are you?" }],
                model: "llama-3.3-70b-versatile"
            });
            console.log("✅ GROQ Response:", completion.choices[0]?.message?.content);
        } catch (e) {
            console.error("❌ GROQ: Failed", e.message);
        }
    } else {
        console.log("⚠️ GROQ: No Key");
    }

    // 3. MISTRAL
    if (process.env.MISTRAL_API_KEY) {
        try {
            const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
            const tools = [{ type: "web_search_premium" }];
            const response = await mistral.beta.conversations.start({
                inputs: [{ role: 'user', content: "Hello, who are you?" }],
                model: 'mistral-large-latest',
                tools: tools
            });
            console.log("✅ MISTRAL Response:", response.choices[0].message.content);
        } catch (e) {
            console.error("❌ MISTRAL: Failed", e.message);
        }
    } else {
        console.log("⚠️ MISTRAL: No Key");
    }
}

testProviders();
