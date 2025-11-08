from fastapi import FastAPI
from .api.endpoints.auth_api import auth_router
from .api.endpoints.healt_api import health_router
from .api.endpoints.progress_api import progress_router
from .api.endpoints.schedule_api import schedule_router
from .api.endpoints.trainee_api import trainee_router

app = FastAPI()

app.include_router(auth_router)
app.include_router(health_router)
app.include_router(progress_router)
app.include_router(schedule_router)
app.include_router(trainee_router)

@app.get("/")
def root_api():
    return {
        "message" : "It's working"
    }
