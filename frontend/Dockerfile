# Этап 1: сборка фронтенда
FROM node:18-alpine AS builder
WORKDIR /app
# Устанавливаем зависимости и собираем проект
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Этап 2: веб-сервер для статических файлов (Nginx)
FROM nginx:alpine
# Копируем собранные файлы Vue приложения
COPY --from=builder /app/dist /usr/share/nginx/html
# Копируем конфиг nginx с настройками прокси и маршрутизации SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Nginx по умолчанию слушает 80 порт, эксплицитно укажем его
EXPOSE 80
# Стандартная команда запуска Nginx (определена в базовом образе)
