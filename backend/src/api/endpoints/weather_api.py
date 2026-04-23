from fastapi import APIRouter, HTTPException, Query, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from src.services.weather_service import WeatherService

weather_router = APIRouter(prefix="/weather", tags=["Weather"])
limiter = Limiter(key_func=get_remote_address)
weather_service = WeatherService()

@weather_router.get("/")
@limiter.limit("5/minute")
async def get_weather(
    request: Request,
    city: str = Query(default="Moscow", max_length=100)
):
    try:
        weather_data = await weather_service.get_weather(city)
        return {"success": True, "data": weather_data}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))