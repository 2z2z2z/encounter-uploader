FROM node:18-alpine

WORKDIR /app

# Скопируем package.json и package-lock.json
COPY package*.json ./

RUN npm install
# или yarn install

# Скопируем весь исходный код прокси
COPY . .

# Открываем порт 3001
EXPOSE 3001

CMD ["npm", "start"]
