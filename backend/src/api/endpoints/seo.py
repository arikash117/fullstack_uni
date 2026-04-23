from fastapi import APIRouter
from fastapi.responses import PlainTextResponse, Response
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

@seo_router.get("/sitemap.xml", include_in_schema=False)
async def sitemap_xml():
    domain = settings.DOMAIN.rstrip('/')
    
    static_urls = [
        {
            "loc": f"{domain}/",
            "lastmod": "2026-04-24",
            "changefreq": "weekly",
            "priority": "1.0"
        },
    ]

    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    for url in static_urls:
        xml_content += "  <url>\n"
        xml_content += f"    <loc>{url['loc']}</loc>\n"
        xml_content += f"    <lastmod>{url['lastmod']}</lastmod>\n"
        xml_content += f"    <changefreq>{url['changefreq']}</changefreq>\n"
        xml_content += f"    <priority>{url['priority']}</priority>\n"
        xml_content += "  </url>\n"
        
    xml_content += '</urlset>'
    
    return Response(content=xml_content, media_type="application/xml")