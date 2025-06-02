# -----------------------------------
# Stage 1: Build (npm run build → dist/)
# -----------------------------------
FROM node:18-alpine AS builder

WORKDIR /app

# Сначала копируем зависимости, чтобы не пересобирать каждый раз весь контент
COPY package*.json ./

RUN npm install

# Копируем исходники Vue
COPY . .

# Собираем Vue 3 (TypeScript) в папку dist/
RUN npm run build

# -----------------------------------
# Stage 2: Serve via nginx
# -----------------------------------
FROM nginx:stable-alpine

# Копируем только готовый результат сборки (dist/) 
# в стандартную директорию nginx для статики
COPY --from=builder /app/dist /usr/share/nginx/html

# (Необязательно) Если нужны какие-то свои настройки nginx, 
# можно скопировать сюда конфиг:
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Экспонируем порт 80 (но в docker-compose мы его не пробрасываем наружу —
# обращение к статикам будет идти через сервер-прокси в отдельном контейнере)
EXPOSE 80

# Запускаем nginx в переднем плане
CMD ["nginx", "-g", "daemon off;"]
