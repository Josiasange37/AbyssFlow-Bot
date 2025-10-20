#!/bin/bash

echo "🌐 Démarrage du serveur AbyssFlow avec accès public..."
echo ""

# Couleurs pour l'affichage
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour obtenir l'IP locale
get_local_ip() {
    # Essayer différentes méthodes pour obtenir l'IP
    local ip=""
    
    # Méthode 1: hostname -I (Linux)
    if command -v hostname >/dev/null 2>&1; then
        ip=$(hostname -I | awk '{print $1}' 2>/dev/null)
    fi
    
    # Méthode 2: ip route (Linux)
    if [ -z "$ip" ] && command -v ip >/dev/null 2>&1; then
        ip=$(ip route get 1.1.1.1 | grep -oP 'src \K\S+' 2>/dev/null)
    fi
    
    # Méthode 3: ifconfig (macOS/Linux)
    if [ -z "$ip" ] && command -v ifconfig >/dev/null 2>&1; then
        ip=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1)
    fi
    
    # Fallback
    if [ -z "$ip" ]; then
        ip="localhost"
    fi
    
    echo "$ip"
}

# Vérifier si Node.js est installé
if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}❌ Node.js n'est pas installé!${NC}"
    echo "Installez Node.js depuis: https://nodejs.org/"
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm >/dev/null 2>&1; then
    echo -e "${RED}❌ npm n'est pas installé!${NC}"
    exit 1
fi

# Aller dans le dossier web
cd "$(dirname "$0")/web" || {
    echo -e "${RED}❌ Impossible d'accéder au dossier web!${NC}"
    exit 1
}

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
    npm install
fi

# Obtenir l'IP locale
LOCAL_IP=$(get_local_ip)

echo -e "${GREEN}🚀 Démarrage du serveur Next.js...${NC}"
echo ""
echo -e "${BLUE}📱 Liens d'accès:${NC}"
echo -e "  • Local:    ${GREEN}http://localhost:3000${NC}"
echo -e "  • Réseau:   ${GREEN}http://$LOCAL_IP:3000${NC}"
echo ""
echo -e "${YELLOW}💡 Instructions:${NC}"
echo "  1. Assurez-vous que votre firewall autorise le port 3000"
echo "  2. Les autres appareils doivent être sur le même réseau WiFi"
echo "  3. Utilisez l'adresse réseau sur vos autres appareils"
echo ""
echo -e "${BLUE}🌐 Pour un accès internet public, utilisez:${NC}"
echo -e "  ${GREEN}npm run tunnel${NC} (dans un autre terminal)"
echo ""
echo -e "${RED}Appuyez sur Ctrl+C pour arrêter le serveur${NC}"
echo ""

# Démarrer le serveur avec accès public
npm run dev:public
