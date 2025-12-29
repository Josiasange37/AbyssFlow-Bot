#!/bin/bash
source .env

echo "Testing Groq with CURL..."
curl -X POST "https://api.groq.com/openai/v1/chat/completions" \
     -H "Authorization: Bearer $GROQ_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "llama-3.3-70b-versatile",
       "messages": [{"role": "user", "content": "Hello, are you working?"}]
     }'
echo ""
echo "Done."
