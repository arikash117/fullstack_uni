from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.endpoints.seo import seo_router

from .api.endpoints.admin_api import admin_router
from .api.endpoints.auth_api import auth_router
# from .api.endpoints.healt_api import health_router
from .api.endpoints.workout_api import workout_router
from .api.endpoints.trainee_api import trainee_router
from .api.endpoints.weather_api import weather_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:80",
        "http://127.0.0.1",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://frontend:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
# app.include_router(health_router)
app.include_router(workout_router)
app.include_router(trainee_router)
app.include_router(admin_router)
app.include_router(seo_router)
app.include_router(weather_router)


@app.get("/")
def root_api():
    return {
        "message" : "It's working"
    }
