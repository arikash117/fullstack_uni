from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from .api.endpoints.auth_api import auth_router
from .api.endpoints.healt_api import health_router
from .api.endpoints.workout_api import workout_router
from .api.endpoints.trainee_api import trainee_router

app = FastAPI()

app.include_router(auth_router)
# app.include_router(health_router)
app.include_router(workout_router)
app.include_router(trainee_router)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def root_api():
    return {
        "message" : "It's working"
    }
