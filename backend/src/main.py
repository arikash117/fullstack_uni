from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from .api.endpoints import admin_api
from .api.endpoints.auth_api import auth_router
from .api.endpoints.healt_api import health_router
from .api.endpoints.workout_api import workout_router
from .api.endpoints.trainee_api import trainee_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
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
app.include_router(admin_api.admin_router)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def root_api():
    return {
        "message" : "It's working"
    }
