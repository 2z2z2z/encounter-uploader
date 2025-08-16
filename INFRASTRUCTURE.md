# 🏗️ Инфраструктура и DevOps

Документация по инфраструктуре Encounter Uploader после рефакторинга (Фаза 6).

## 📋 Обзор архитектуры

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Server      │    │     Redis       │
│   (Nginx)       │    │   (Express)     │    │   (Sessions)    │
│   Port: 80      │────│   Port: 3001    │────│   Port: 6379    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🐳 Docker конфигурация

### Production
```bash
# Запуск production версии
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

### Development
```bash
# Запуск development версии с hot reload
docker-compose -f docker-compose.dev.yml up

# Только сборка без запуска
docker-compose -f docker-compose.dev.yml build
```

## 🔧 Переменные окружения

### Обязательные для Production

```bash
# Безопасность
SESSION_SECRET=your-super-secret-32-char-key
REDIS_PASSWORD=your-redis-password

# Сеть
TRUST_PROXY=true
NODE_ENV=production
```

### Полный список переменных

См. файл `env.example` для всех доступных настроек.

## 📊 Healthcheck endpoints

- **Frontend**: `GET http://localhost:8099/`
- **Server**: `GET http://localhost:3001/health`
- **Redis**: Встроенный `redis-cli ping`

### Пример ответа healthcheck:

```json
{
  "uptime": 125.423,
  "message": "OK",
  "timestamp": "2025-01-15T20:15:30.123Z",
  "service": "encounter-uploader-server",
  "version": "1.0.0",
  "environment": "production",
  "sessionStore": "redis",
  "session": "OK",
  "memory": {
    "rss": 45123456,
    "heapTotal": 25165824,
    "heapUsed": 18742144,
    "external": 1234567
  }
}
```

## 🔒 Безопасность

### Сессии
- **Production**: Redis store с шифрованием
- **Development**: Memory store
- **Настройки**: secure cookies, httpOnly, sameSite=lax

### Networking
- Redis не доступен извне
- Все сервисы в изолированной Docker сети
- Trust proxy настройки для HTTPS терминации

### Данные
- Пароли не сохраняются в localStorage
- Сессии истекают через 24 часа
- Автоматическая очистка Redis данных

## 📈 Мониторинг и логи

### Логи Docker
```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f app
docker-compose logs -f server
docker-compose logs -f redis
```

### Уровни логирования
- `error`: Только ошибки
- `warn`: Предупреждения + ошибки
- `info`: Информация + предупреждения + ошибки
- `debug`: Отладка (только для development)

### Метрики
- Время работы (uptime)
- Использование памяти
- Статус сессий
- Время ответа API

## 🚀 Развертывание

### Первоначальная настройка

1. **Клонирование и настройка**:
```bash
git clone <repository>
cd encounter-uploader
cp env.example .env
# Отредактируйте .env файл
```

2. **Генерация секретов**:
```bash
# SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# REDIS_PASSWORD (опционально)
openssl rand -base64 32
```

3. **Запуск**:
```bash
docker-compose up -d
```

### Обновление

```bash
# Остановка
docker-compose down

# Обновление кода
git pull

# Пересборка и запуск
docker-compose up -d --build
```

### Бэкапы

```bash
# Бэкап Redis данных
docker exec encounter-uploader_redis_1 redis-cli BGSAVE

# Копирование бэкапа
docker cp encounter-uploader_redis_1:/data/dump.rdb ./backup/

# Восстановление
docker cp ./backup/dump.rdb encounter-uploader_redis_1:/data/
docker-compose restart redis
```

## 🔧 Troubleshooting

### Проблемы с подключением

1. **Проверка статуса сервисов**:
```bash
docker-compose ps
```

2. **Проверка healthcheck**:
```bash
curl http://localhost:8099/
curl http://localhost:3001/health
```

3. **Логи ошибок**:
```bash
docker-compose logs --tail=50 app
docker-compose logs --tail=50 server
```

### Проблемы с Redis

1. **Подключение к Redis CLI**:
```bash
docker-compose exec redis redis-cli
```

2. **Проверка сессий**:
```bash
# В Redis CLI
KEYS sess:*
```

3. **Очистка сессий**:
```bash
# В Redis CLI
FLUSHDB
```

### Проблемы с сессиями

1. **Проверка конфигурации**:
```bash
curl -v http://localhost:3001/health
```

2. **Сброс сессий**:
```bash
docker-compose restart server redis
```

## 📚 Дополнительные ресурсы

- [Docker Compose документация](https://docs.docker.com/compose/)
- [Redis документация](https://redis.io/documentation)
- [Express Session документация](https://github.com/expressjs/session)
- [Connect Redis документация](https://github.com/tj/connect-redis)

## 🆘 Поддержка

При проблемах с инфраструктурой:

1. Проверьте healthcheck endpoints
2. Просмотрите логи всех сервисов
3. Убедитесь в правильности переменных окружения
4. Проверьте доступность портов
5. Перезапустите проблемные сервисы

---

*Документация обновлена согласно Фазе 6 плана рефакторинга*

