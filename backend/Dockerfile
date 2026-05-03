FROM python:3.11-slim as base

WORKDIR /app

# Системные зависимости
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc default-libmysqlclient-dev pkg-config curl \
    && rm -rf /var/lib/apt/lists/*

# Копируем зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем код
COPY . .

# Stage для тестов
FROM base as test
RUN pip install --no-cache-dir pytest pytest-cov pytest-asyncio httpx
ENV DATABASE_TEST_URL=sqlite:///:memory:
CMD ["pytest", "tests/", "-v", "--cov=src", "--cov-report=term-missing"]

# Production stage
FROM base as production
EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]