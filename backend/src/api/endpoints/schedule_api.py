from fastapi import APIRouter

schedule_router = APIRouter()

# POST
@schedule_router.post('/schedule/trainings/{training_id}')
async def post_training(training_id: int):
    return


# GET
@schedule_router.get('/schedule/trainings')
async def get_trainings():
    return

@schedule_router.get('/schedule/trainings/{training_id}')
async def get_training(training_id: int):
    return
