from fastapi import APIRouter
from fastapi.responses import PlainTextResponse
from src.core.config import settings

seo_router = APIRouter(tags=["seo"])

@seo_router.get("/robots.txt", response_class=PlainTextResponse, include_in_schema=False)
async def robots_txt():
    """
    Файл robots.txt для поисковых ботов.
    include_in_schema=False — чтобы не светился в /docs
    """
    
    domain = settings.DOMAIN
    
    content = f"""User-agent: *
Allow: /
Disallow: /docs
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard
Disallow: /login
Disallow: /register
Disallow: /trainee/*/health
Disallow: /trainee/*/schedule
Disallow: /trainee/*/progress

Sitemap: {domain}/sitemap.xml
"""
    return PlainTextResponse(content, media_type="text/plain")