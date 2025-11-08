from fastapi import APIRouter


auth_router = APIRouter()

# Регистрация
@auth_router.post('/signup')
async def signup():
    return

@auth_router.post('/login')
async def login():
    return
