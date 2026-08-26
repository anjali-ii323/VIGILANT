FROM node:20-slim

WORKDIR /app

# Install openssl for Prisma compatibility in slim images
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

EXPOSE 8000

CMD ["node", "dist/main.js"]
