from fastapi import APIRouter

router = APIRouter()

# POST
@router.post("/trainee")
async def post_trainee():
    return


# GET
@router.get("/trainee")
async def get_trainee():
    return

@router.get("/profile/trainees")
async def get_trainees():
    return
