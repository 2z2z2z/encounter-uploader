# Этап 1: базовый образ с зависимостями
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Этап 2: development сборка
FROM base AS development
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

# Этап 3: production сборка
FROM base AS builder
COPY . .
RUN npm run build

# Этап 4: production веб-сервер (Nginx)
FROM nginx:1.25-alpine AS production
# Установка wget для healthcheck
RUN apk add --no-cache wget

# Копируем собранные файлы Vue приложения
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфиг nginx с настройками прокси и маршрутизации SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Создаем директорию для логов
RUN mkdir -p /var/log/nginx

# Nginx по умолчанию слушает 80 порт
EXPOSE 80

# Улучшенная команда запуска с логированием
CMD ["nginx", "-g", "daemon off;"]

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
