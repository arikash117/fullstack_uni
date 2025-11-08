from fastapi import APIRouter

health_router = APIRouter()

# POST
@health_router.post('/health/cpf')
async def post_cpf():
    return

@health_router.post('/health/calories')
async def post_calories():
    return

@health_router.post('/health/steps')
async def post_steps():
    return

@health_router.post('/health/water')
async def post_water():
    return

@health_router.post('/health/injuries')
async def post_injuries():
    return


# GET
@health_router.get('/health/cpf')
async def get_cpf():
    return

@health_router.get('/health/calories')
async def get_calories():
    return

@health_router.get('/health/steps')
async def get_steps():
    return

@health_router.get('/health/water')
async def get_water():
    return

@health_router.get('/health/injuries')
async def get_injuries():
    return
