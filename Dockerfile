# Use Node.js LTS (Long Term Support) image
FROM node:20-slim

# Install dependencies for canvas/puppeteer/sharp if needed (optional but good for stability)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    imagemagick \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose the API port
EXPOSE 8080

# Use npm start to run the full Bot Factory (index.js)
CMD ["npm", "start"]
