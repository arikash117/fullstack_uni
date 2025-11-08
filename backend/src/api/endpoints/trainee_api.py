from fastapi import APIRouter

trainee_router = APIRouter()

# POST
@trainee_router.post('/trainies/{trainee_id}')
async def post_trainee(trainee_id: int):
    return


# GET
@trainee_router.get('/trainies/{trainee_id}')
async def get_trainee(trainee_id: int):
    return

@trainee_router.get('/profile/trainees')
async def get_trainees():
    return
