FROM node:18-alpine
WORKDIR /app
# Установка только продакшн-зависимостей (dev-зависимостей нет)
COPY package*.json ./
RUN npm ci --only=production
# Копируем исходный код сервера
COPY . .
EXPOSE 3001
# Запуск Node.js сервера (Proxy)
CMD ["npm", "start"]
