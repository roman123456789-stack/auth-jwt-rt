Бэкенд-приложение на NestJS с JWT-аутентификацией, Redis для хранения refresh-токенов и MySQL как основной БД. Логи собираются в ELK (Elasticsearch, Logstash, Kibana) для мониторинга.

---

## 🔐 Переменные окружения

Перед запуском создайте файл `.env` в корне проекта.

### Обязательные переменные:

```env.['development'/'production']
# Режим приложения (development / production)
NODE_ENV=development

# Порт, на котором будет работать NestJS
PORT=3000

# Секретный ключ для подписи JWT access-токенов (любая случайная строка)
JWT_ACCESS_SECRET=ваш_случайный_секрет_ключ

# Время жизни access-токена в секундах (например, 900 = 15 минут)
JWT_ACCESS_EXPIRES_IN=900

# Издатель токенов (может быть любым именем)
JWT_ISSUER=myapp-auth-service

# Время жизни refresh-токена в секундах (например, 1209600 = 7 дней)
REFRESH_TOKEN_EXPIRES_IN=1209600

# Тип БД
DB_TYPE=mysql

# Хост MySQL (должен совпадать с именем сервиса в docker-compose)
DB_HOST=mysql

# Порт MySQL
DB_PORT=3306

# Имя пользователя MySQL
DB_USERNAME=root

# Пароль MySQL
DB_PASSWORD=secret_password

# Название базы данных
DB_NAME=auth_module

# Автоматически синхронизировать схему БД (только для разработки!)
DB_SYNC=true

# Показывать SQL-запросы в логах (true/false)
DB_LOGGING=false

# Адрес Redis (должен совпадать с именем сервиса в docker-compose)
REDIS_URL=redis://redis:6379

```bash
$ docker-compose up -d --build
```

## Stay in touch

- Author - [Roman](https://t.me/nee_copirui)
