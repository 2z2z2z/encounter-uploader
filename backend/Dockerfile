FROM node:18-alpine

WORKDIR /app

# Копируем package.json и package-lock.json (или yarn.lock)
COPY package*.json ./

RUN npm install
# или yarn install

# Скопируем весь исходный бэкенд-код
COPY . .

# По умолчанию ваша команда запуска — node index.js
EXPOSE 3000

CMD ["npm", "start"]
