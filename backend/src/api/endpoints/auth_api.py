from fastapi import APIRouter


router = APIRouter()

# Регистрация
@router.post("/signup")
async def signup():
    return

@router.post("/login")
async def login():
    return
