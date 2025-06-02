# -----------------------------------
# Server = nginx-reverse-proxy
# -----------------------------------
FROM nginx:stable-alpine

# Копируем свой конфиг nginx (nginx.conf) в контейнер
# Он лежит в папке server/nginx.conf
COPY nginx.conf /etc/nginx/nginx.conf

# Экспонируем порт 80
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]
