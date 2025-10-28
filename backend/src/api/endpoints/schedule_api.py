from fastapi import APIRouter

router = APIRouter()

# POST
@router.post("/schedule/{training_id}/training")
async def post_training():
    return


# GET
@router.get("/schedule/trainings")
async def get_trainings():
    return

@router.get("/schedule/{training_id}/training")
async def get_training():
    return
