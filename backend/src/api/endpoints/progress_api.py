from fastapi import APIRouter

progress_router = APIRouter()

# POST
@progress_router.post('progress/weight')
async def post_weight():
    return

@progress_router.post('/progress/goal')
async def post_goal():
    return

@progress_router.post('/progress/steps')
async def post_steps():
    return

# GET
@progress_router.get('/progress/weight')
async def get_weight():
    return

@progress_router.get('/progress/goal')
async def get_goal():
    return

@progress_router.get('/progress/steps')
async def get_steps():
    return