# Используем официальный образ Node.js
FROM node:18

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm install


COPY . .

RUN npm run build


EXPOSE 3000


CMD ["node", "dist/main.js"]