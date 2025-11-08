from pydantic import BaseModel, EmailStr

class Trainee(BaseModel):
    id: int
    name: str
    phone_number: str
    