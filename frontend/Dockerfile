# frontend/Dockerfile
FROM node:20-alpine as base
WORKDIR /app

# Копируем package файлы
COPY package.json package-lock.json* ./

# Stage для зависимостей
FROM base as dependencies
RUN npm ci

# Stage для тестов
FROM dependencies as test
COPY . .
RUN npm install -D vitest @vitest/coverage-v8 playwright @playwright/test
CMD ["npm", "run", "test"]

# Stage для build
FROM dependencies as build
COPY . .
RUN npm run build

# Production stage с Nginx
FROM nginx:alpine as production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]