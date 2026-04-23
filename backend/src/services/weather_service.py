import httpx
from typing import Optional, Dict, Any
from datetime import datetime
import os
from tenacity import retry, stop_after_attempt, wait_exponential

class WeatherService:
    def __init__(self):
        self.api_key = os.getenv("WEATHER_API_KEY")
        self.base_url = "https://api.openweathermap.org/data/2.5"
        self.timeout = 10.0
        
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True
    )
    async def get_weather(self, city: str = "Moscow") -> Optional[Dict[str, Any]]:
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/weather",
                    params={
                        "q": city,
                        "appid": self.api_key,
                        "units": "metric",
                        "lang": "ru"
                    }
                )
                response.raise_for_status()
                return self._normalize_response(response.json())
        except httpx.TimeoutException:
            raise Exception("Превышено время ожидания ответа от погодного сервиса")
        except httpx.HTTPError as e:
            raise Exception(f"Ошибка при получении погоды: {str(e)}")
    
    def _normalize_response(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "city": data.get("name", "Unknown"),
            "temperature": round(data.get("main", {}).get("temp", 0)),
            "feels_like": round(data.get("main", {}).get("feels_like", 0)),
            "description": data.get("weather", [{}])[0].get("description", ""),
            "icon": data.get("weather", [{}])[0].get("icon", ""),
            "humidity": data.get("main", {}).get("humidity", 0),
            "wind_speed": data.get("wind", {}).get("speed", 0),
            "updated_at": datetime.utcnow().isoformat()
        }
