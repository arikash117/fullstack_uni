from fastapi import APIRouter

router = APIRouter()

# POST
@router.post("/health/cpf")
async def post_cpf():
    return

@router.post("/health/calories")
async def post_calories():
    return

@router.post("/health/steps")
async def post_steps():
    return

@router.post("/health/water")
async def post_water():
    return

@router.post("/health/injuries")
async def post_injuries():
    return


# GET
@router.get("/health/cpf")
async def get_cpf():
    return

@router.get("/health/calories")
async def get_calories():
    return

@router.get("/health/steps")
async def get_steps():
    return

@router.get("/health/water")
async def get_water():
    return

@router.get("/health/injuries")
async def get_injuries():
    return
