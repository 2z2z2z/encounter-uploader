# Этап 1: сборка фронтенда
FROM node:20-alpine AS builder
WORKDIR /app

# Копируем файлы зависимостей и устанавливаем их
COPY package*.json ./
RUN npm ci --only=production=false

# Копируем исходный код и собираем проект
COPY . .
RUN npm run build

# Этап 2: веб-сервер для статических файлов (Nginx)
FROM nginx:alpine AS production

# Создаем пользователя nginx для безопасности
RUN addgroup -g 101 -S nginx || true

# Копируем собранные файлы Vue приложения
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфиг nginx с настройками прокси и маршрутизации SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Устанавливаем правильные права доступа
RUN chown -R nginx:nginx /usr/share/nginx/html

# Nginx по умолчанию слушает 80 порт
EXPOSE 80

# Запуск от пользователя nginx для безопасности
USER nginx

# Стандартная команда запуска Nginx
CMD ["nginx", "-g", "daemon off;"]
