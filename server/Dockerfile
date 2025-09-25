FROM node:20-alpine AS production
WORKDIR /app

# Создаем пользователя для безопасности
RUN addgroup -g 1000 -S appuser && \
    adduser -S -u 1000 -G appuser appuser

# Установка только продакшн-зависимостей
COPY package*.json ./
RUN npm ci --only=production

# Копируем исходный код сервера
COPY . .

# Устанавливаем права доступа
RUN chown -R appuser:appuser /app

# Переключаемся на unprivileged пользователя
USER appuser

# Порт сервера
EXPOSE 3001

# Health check для мониторинга
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { \
    process.exit(res.statusCode === 200 ? 0 : 1) \
  }).on('error', () => { process.exit(1) })"

# Запуск Node.js сервера (Proxy)
CMD ["npm", "start"]
