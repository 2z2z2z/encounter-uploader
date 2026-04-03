#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Первоначальная настройка сервера для encounter-uploader
# Запускать от root на VPS:  bash /opt/encounter-uploader/deploy/setup.sh
# ============================================================

APP_DIR="/opt/encounter-uploader"
DOMAIN="zalivator.enkmv.ru"
DEPLOY_USER="deploy"

echo "=== 1. Проверка/установка Docker ==="
if command -v docker &>/dev/null; then
    echo "Docker уже установлен: $(docker --version)"
else
    echo "Устанавливаю Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo "Docker установлен: $(docker --version)"
fi

# Проверяем docker compose (v2 plugin)
if docker compose version &>/dev/null; then
    echo "Docker Compose plugin: $(docker compose version)"
else
    echo "Устанавливаю Docker Compose plugin..."
    apt-get update && apt-get install -y docker-compose-plugin
    echo "Docker Compose plugin установлен"
fi

# Добавляем deploy-юзера в группу docker
if id "$DEPLOY_USER" &>/dev/null; then
    usermod -aG docker "$DEPLOY_USER"
    echo "Пользователь $DEPLOY_USER добавлен в группу docker"
else
    echo "ВНИМАНИЕ: пользователь $DEPLOY_USER не найден, создайте его или измените DEPLOY_USER"
fi

echo ""
echo "=== 2. Проверка/установка Nginx ==="
if command -v nginx &>/dev/null; then
    echo "Nginx уже установлен: $(nginx -v 2>&1)"
else
    echo "Устанавливаю Nginx..."
    apt-get update && apt-get install -y nginx
    systemctl enable nginx
    systemctl start nginx
    echo "Nginx установлен"
fi

echo ""
echo "=== 3. Проверка/установка Certbot ==="
if command -v certbot &>/dev/null; then
    echo "Certbot уже установлен: $(certbot --version 2>&1)"
else
    echo "Устанавливаю Certbot..."
    apt-get update && apt-get install -y certbot python3-certbot-nginx
    echo "Certbot установлен"
fi

echo ""
echo "=== 4. Настройка репозитория ==="
if [ -d "$APP_DIR/.git" ]; then
    echo "Репозиторий уже склонирован в $APP_DIR"
    cd "$APP_DIR"
    git fetch origin main
    git reset --hard origin/main
else
    echo "Клонирую репозиторий..."
    git clone https://github.com/2z2z2z/encounter-uploader.git "$APP_DIR"
fi
chown -R "$DEPLOY_USER":"$DEPLOY_USER" "$APP_DIR"

echo ""
echo "=== 5. Создание директории для данных ==="
mkdir -p "$APP_DIR/data"
chown "$DEPLOY_USER":"$DEPLOY_USER" "$APP_DIR/data"

echo ""
echo "=== 6. Создание .env файла (если нет) ==="
ENV_FILE="$APP_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
    SESSION_SECRET=$(openssl rand -hex 32)
    cat > "$ENV_FILE" <<EOF
SESSION_SECRET=$SESSION_SECRET
EOF
    chown "$DEPLOY_USER":"$DEPLOY_USER" "$ENV_FILE"
    chmod 600 "$ENV_FILE"
    echo "Создан $ENV_FILE с SESSION_SECRET"
else
    echo "$ENV_FILE уже существует, пропускаю"
fi

echo ""
echo "=== 7. Настройка Nginx vhost ==="
mkdir -p /var/www/certbot
cp "$APP_DIR/deploy/nginx-site.conf" /etc/nginx/sites-available/zalivator.conf

# Временный конфиг без SSL для получения сертификата
cat > /etc/nginx/sites-available/zalivator-temp.conf <<'NGINX'
server {
    listen 80;
    server_name zalivator.enkmv.ru;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://127.0.0.1:8099;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

# Если SSL-сертификат еще не получен, используем временный конфиг
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "SSL-сертификат уже существует"
    ln -sf /etc/nginx/sites-available/zalivator.conf /etc/nginx/sites-enabled/zalivator.conf
    rm -f /etc/nginx/sites-enabled/zalivator-temp.conf
else
    echo "SSL-сертификат не найден, включаю временный конфиг для получения..."
    ln -sf /etc/nginx/sites-available/zalivator-temp.conf /etc/nginx/sites-enabled/zalivator-temp.conf
    rm -f /etc/nginx/sites-enabled/zalivator.conf
    nginx -t && systemctl reload nginx

    echo ""
    echo "Получаю SSL-сертификат..."
    certbot certonly --webroot -w /var/www/certbot -d "$DOMAIN" --non-interactive --agree-tos --email admin@enkmv.ru

    # Переключаемся на полный конфиг с SSL
    rm -f /etc/nginx/sites-enabled/zalivator-temp.conf
    ln -sf /etc/nginx/sites-available/zalivator.conf /etc/nginx/sites-enabled/zalivator.conf
fi

# Убираем default-сайт, если он мешает
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl reload nginx
echo "Nginx настроен"

echo ""
echo "=== 8. Настройка автопродления сертификата ==="
# Certbot обычно сам создает cron/timer, проверяем
if systemctl is-enabled certbot.timer &>/dev/null 2>&1; then
    echo "Certbot timer уже активен"
else
    systemctl enable certbot.timer 2>/dev/null || echo "Certbot timer не найден (будет работать через cron)"
fi

echo ""
echo "=== 9. Права sudo для deploy-юзера ==="
SUDOERS_FILE="/etc/sudoers.d/encounter-uploader"
if [ ! -f "$SUDOERS_FILE" ]; then
    cat > "$SUDOERS_FILE" <<SUDO
$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/bin/docker, /usr/bin/docker compose *
SUDO
    chmod 440 "$SUDOERS_FILE"
    echo "Sudo-права настроены для $DEPLOY_USER"
else
    echo "Sudo-права уже настроены"
fi

echo ""
echo "=== 10. Запуск приложения ==="
cd "$APP_DIR"
docker compose up --build -d
echo "Контейнеры запущены"

echo ""
echo "=========================================="
echo "Готово! Проверьте:"
echo "  http://$DOMAIN"
echo "  https://$DOMAIN"
echo ""
echo "Следующий шаг: добавьте GitHub Secrets в репозиторий:"
echo "  VPS_HOST, VPS_USER, VPS_SSH_KEY"
echo "=========================================="
