# AbyssFlow Bot Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create directories
RUN mkdir -p auth_info_baileys data

# Expose port (optional, for health checks)
EXPOSE 3000

# Start the bot
CMD ["npm", "start"]
