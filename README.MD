nginx:
build:
context: .
dockerfile: Dockerfile.nginx
container_name: nginx_container
ports: - '80:80'
depends_on: - backend

Сервис nginx:
Заменили image: nginx:alpine на build, чтобы использовать наш Dockerfile.nginx:
context: . — указывает, что Docker должен использовать текущую директорию для сборки.
dockerfile: Dockerfile.nginx — указывает, что нужно использовать файл Dockerfile.nginx.

Про env

Когда Docker запускает контейнер backend_container, он передаёт эти переменные как переменные окружения в контейнер.
Это значит, что внутри контейнера эти переменные доступны через process.env в твоём Node.js коде.

3.3. Как это работает в контейнере
Когда ты запускаешь docker compose up, Docker:
Читает .env и подставляет значения в docker-compose.yaml.
Запускает контейнер backend_container с переменными окружения, указанными в environment.
Внутри контейнера Node.js (твой бэкенд) получает доступ к этим переменным через process.env.

3.4. Пример
Переменная DB_HOST:
В .env: DB_HOST=postgres_db_new.
В docker-compose.yaml: DB_HOST: ${DB_HOST} → становится DB_HOST: postgres_db_new.
В контейнере: process.env.DB_HOST равно postgres_db_new.
В config/database.ts: host: process.env.DB_HOST → host: postgres_db_new.
Бэкенд подключается к PostgreSQL, используя postgres_db_new:5432 (имя хоста postgres_db_new — это имя контейнера PostgreSQL, доступное внутри сети Docker).
**********\*\***********\_\_**********\*\***********-
вопрос потому дулаить

что дальше ты гвоорил двигатся в этом напрявлении давай оставим просто nginx.conf

Создать Nginx-конфигурацию default.conf (хотя у нас уже есть nginx.conf, мы можем переименовать его или создать новый).
Добавить поддержку SSL-сертификатов (локально с самоподписанным сертификатом, как мы обсуждали ранее).
Я предлагаю двигаться к настройке HTTPS в Nginx, так как это следующий логичный шаг в "Конфигурации для продакшн". Мы можем начать с создания самоподписанного сертификата и настройки Nginx для HTTPS. Это позволит тебе протестировать работу приложения по HTTPS локально, что соответствует ТЗ ("Проксирует HTTPS-запросы на NestJS-приложение"). Что скажешь?

teeeest
