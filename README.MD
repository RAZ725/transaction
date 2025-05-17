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
