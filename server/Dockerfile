# Этап 1: базовый образ с зависимостями
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Этап 2: development сборка
FROM base AS development
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]

# Этап 3: production сборка
FROM base AS production
# Установка curl для healthcheck
RUN apk add --no-cache curl

# Копируем исходный код сервера
COPY . .

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Создаем директорию для логов
RUN mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app

# Переключаемся на пользователя nodejs
USER nodejs

EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Запуск Node.js сервера (Proxy)
CMD ["npm", "start"]
