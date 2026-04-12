import boto3
from botocore.client import Config
import os
from functools import lru_cache

class MinioClient:
    def __init__(self):
        self.endpoint = os.getenv("MINIO_ENDPOINT", "minio")
        self.port = os.getenv("MINIO_PORT", "9000")
        self.access_key = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
        self.secret_key = os.getenv("MINIO_SECRET_KEY", "minioadmin123")
        self.bucket = os.getenv("MINIO_BUCKET", "trainee-photos")
        self.public_url = os.getenv("MINIO_PUBLIC_URL", "http://localhost:9000")
        
        self.client = boto3.client(
            's3',
            endpoint_url=f'http://{self.endpoint}:{self.port}',
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            config=Config(signature_version='s3v4'),
            region_name='us-east-1'
        )
        
    def ensure_bucket_exists(self):
        """Создает бакет если не существует"""
        try:
            self.client.head_bucket(Bucket=self.bucket)
        except:
            self.client.create_bucket(Bucket=self.bucket)
    
    def upload_file(self, file_obj, object_name: str, content_type: str = "image/jpeg") -> str:
        """Загружает файл в MinIO и возвращает путь"""
        self.ensure_bucket_exists()
        
        self.client.upload_fileobj(
            file_obj,
            self.bucket,
            object_name,
            ExtraArgs={'ContentType': content_type}
        )
        
        return object_name
    
    def get_public_url(self, object_name: str) -> str:
        """Генерирует простой публичный URL (для PUBLIC бакетов)"""
        # Просто собираем URL без подписи
        return f"{self.public_url}/{self.bucket}/{object_name}"
    
    def get_presigned_url(self, object_name: str, expiration: int = 3600) -> str:
        """Генерирует presigned URL (для PRIVATE бакетов)"""
        try:
            url = self.client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': object_name},
                ExpiresIn=expiration
            )
            
            # Заменяем внутренний hostname на localhost
            url = url.replace(f'http://{self.endpoint}:{self.port}', self.public_url)
            
            return url
        except Exception as e:
            print(f"Error generating presigned URL: {e}")
            return ""
    
    def delete_file(self, object_name: str):
        """Удаляет файл из MinIO"""
        try:
            self.client.delete_object(Bucket=self.bucket, Key=object_name)
        except Exception as e:
            print(f"Error deleting file: {e}")

@lru_cache()
def get_minio_client() -> MinioClient:
    return MinioClient()