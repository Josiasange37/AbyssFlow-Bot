#!/bin/bash
source .env

echo "Testing Mistral with CURL..."
curl -X POST "https://api.mistral.ai/v1/chat/completions" \
     -H "Authorization: Bearer $MISTRAL_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "mistral-small",
       "messages": [{"role": "user", "content": "Hello!"}]
     }'
echo ""
echo "Done."
