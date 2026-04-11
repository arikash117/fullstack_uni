FROM python:3.11-slim

WORKDIR /app

# Системные зависимости для MySQL и сборки
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc default-libmysqlclient-dev pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Копируем зависимости и устанавливаем их
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем исходный код
COPY . .

# Открываем порт для FastAPI
EXPOSE 8000

# Запуск с hot-reload для разработки
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]