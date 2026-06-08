FROM node:18-alpine

WORKDIR /app

# Install all deps (including devDeps: ts-node, typescript) in one clean step
COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npx", "ts-node", "src/index.ts"]
