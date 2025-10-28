from fastapi import APIRouter

router = APIRouter()

# POST
@router.post("/progress/weight")
async def post_weight():
    return

@router.post("/progress/goal")
async def post_goal():
    return

@router.post("/progress/steps")
async def post_steps():
    return

# GET
@router.get("/progress/weight")
async def get_weight():
    return

@router.get("/progress/goal")
async def get_goal():
    return

@router.get("/progress/steps")
async def get_steps():
    return