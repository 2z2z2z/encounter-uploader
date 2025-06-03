# Этап 1: сборка TypeScript (backend)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci        # Установка всех (включая dev) зависимостей для компиляции
COPY . .
# Компиляция TypeScript в JavaScript (CommonJS в папку dist)
RUN npx tsc src/index.ts --outDir dist --esModuleInterop

# Удаляем dev-зависимости, оставляя только продакшн-пакеты
RUN npm prune --production

# Этап 2: финальный минимальный образ для backend
FROM node:18-alpine
WORKDIR /app
# Копируем скомпилированный код и продакшн-зависимости
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
EXPOSE 3000
# Запускаем Express сервер
CMD ["node", "dist/index.js"]
