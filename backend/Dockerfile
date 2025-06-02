# -----------------------------
# Stage 1: Build (TypeScript → JavaScript)
# -----------------------------
FROM node:18-alpine AS builder

WORKDIR /app

# Сначала копируем package.json + package-lock.json (или yarn.lock),
# чтобы «закешировать» layer с npm install
COPY package*.json ./

# Если есть конкретные приватные регистры, можно указать .npmrc здесь
RUN npm install

# Копируем всё из backend (включая tsconfig.json, src/ и пр.)
COPY . .

# Запускаем сборку TypeScript (должна положить результат в папку dist/)
# Предполагаем, что в package.json есть script "build": "tsc"
RUN npm run build


# -----------------------------
# Stage 2: Production image
# -----------------------------
FROM node:18-alpine

WORKDIR /app

# Копируем только то, что нужно для production-пакетов:
COPY package*.json ./
RUN npm install --only=production

# Копируем собранный код из предыдущего шага
COPY --from=builder /app/dist ./dist

# Если у вас есть какие-то статические ресурсы (public/), скопируйте их тоже
# COPY --from=builder /app/public ./public

ENV NODE_ENV=production

# Экспонируем порт, на котором слушает ваш Express/Koa/NestJS
EXPOSE 5000

# Точка входа: запускаем готовый js
CMD ["node", "dist/index.js"]
