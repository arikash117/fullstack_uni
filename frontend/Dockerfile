FROM node:20-alpine

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package.json package-lock.json* ./
RUN npm ci

# Копируем исходный код
COPY . .

# Открываем порт для Vite
EXPOSE 5173

# Запуск dev-сервера с hot-reload
# host 0.0.0.0 нужен для доступа извне контейнера
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]