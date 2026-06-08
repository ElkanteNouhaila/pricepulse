FROM node:18-alpine

WORKDIR /app

# Install all deps (including devDeps: ts-node, typescript) in one clean step
COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]