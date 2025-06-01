# ---------------------------------------------
# 1) Сборка фронтенда
# ---------------------------------------------
FROM node:18-alpine AS build

WORKDIR /app

# Скопируем только package.json и package-lock.json/ yarn.lock, чтобы быстрее закешировать зависимости
COPY package*.json ./
# Если у вас yarn: COPY yarn.lock ./

RUN npm install
# или:
# RUN yarn install

# Скопируем весь исходный код
COPY . .

# Собираем production-бандл
RUN npm run build
# или:
# RUN yarn build

# ---------------------------------------------
# 2) Сервирование статических файлов через nginx
# ---------------------------------------------
FROM nginx:stable-alpine

# Удалим дефолтный контент nginx
RUN rm -rf /usr/share/nginx/html/*

# Скопируем собранный build из предыдущего шага
COPY --from=build /app/dist /usr/share/nginx/html

# Если нужно, можно добавить свой конфиг nginx:
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт 80 (внутри контейнера)
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]
