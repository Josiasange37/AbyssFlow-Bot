#!/bin/bash

echo "🛑 Arrêt des instances existantes..."
pkill -f "node abyssflow"

echo "⏳ Attente de 2 secondes..."
sleep 2

echo "🚀 Démarrage du bot..."
node abyssflow.js
