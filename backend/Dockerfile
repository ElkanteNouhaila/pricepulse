FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm install ts-node typescript

COPY . .

EXPOSE 3000

CMD ["npx", "ts-node", "src/index.ts"]