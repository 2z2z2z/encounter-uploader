# ---------------------------------------------
# 1) Этап сборки (Node.js)
# ---------------------------------------------
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build   # соберётся dist/ в /app/dist

# ---------------------------------------------
# 2) Этап «runtime» (Nginx)
# ---------------------------------------------
FROM nginx:stable-alpine

# Удаляем стандартные html-файлы nginx
RUN rm -rf /usr/share/nginx/html/*

# Копируем наш скомпилированный dist/
COPY --from=build /app/dist /usr/share/nginx/html

# Копируем свой nginx.conf поверх дефолтного
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
