import uuid
from fastapi import APIRouter, Depends, File, Query, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from io import BytesIO

from src.models.user import User
from src.core.auth import get_current_user
from src.database.db import get_db
from src.core.minio_client import get_minio_client
from src.schemas.trainee import (
    TraineesResponse,
    TraineeResponse,
    CreateTrainee,
    UpdateTrainee,
    DeleteTraineeResponse,
)
from src.crud.trainee import (
    get_list_trainees,
    create_trainee,
    delete_trainee,
    get_trainee_by_id,
    update_trainee_by_id,
)


trainee_router = APIRouter(prefix="/trainees")

# GET LIST
@trainee_router.get("/", response_model=List[TraineesResponse])
def get_trainees(
    coach_id: Optional[int] = Query(None),
    name: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if coach_id is not None:
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Только админ может просматривать чужих трейни"
            )
        effective_coach_id = coach_id
    else:
        effective_coach_id = current_user.id

    trainees = get_list_trainees(db=db, name=name, coach_id=effective_coach_id)
    return trainees

# GET 
@trainee_router.get("/{trainee_id}", response_model=TraineeResponse)
def get_trainee(
    trainee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        trainee = get_trainee_by_id(db=db, trainee_id=trainee_id)
        if current_user.role != "admin" and trainee.coach_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")
        return trainee
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

# POST
@trainee_router.post("/", response_model=TraineeResponse)
def create(
    trainee_data: CreateTrainee,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        trainee = create_trainee(db=db, trainee_data=trainee_data, coach_id=current_user.id)
        return trainee
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ошибка при создании тренирующегося")
    
# UPLOAD PHOTO
@trainee_router.post("/{trainee_id}/photo", response_model=TraineeResponse)
async def upload_trainee_photo(
    trainee_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print(f"Received file: {file.filename}, content_type: {file.content_type}, size: {file.size}")
    trainee = get_trainee_by_id(db, trainee_id)
    if current_user.role != "admin" and trainee.coach_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нет доступа")

    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Можно загружать только изображения")

    file_ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    safe_filename = f"{uuid.uuid4()}.{file_ext}"
    object_name = f"trainees/{safe_filename}"

    file_content = await file.read()
    file_stream = BytesIO(file_content)

    minio_client = get_minio_client()
    try:
        minio_client.upload_file(
            file_stream, 
            object_name, 
            content_type=file.content_type
        )
    except Exception as e:
        print(f"MinIO upload error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ошибка при загрузке файла")

    if trainee.photo_path:
        try:
            minio_client.delete_file(trainee.photo_path)
        except:
            pass
        
    trainee.photo_path = object_name
    db.commit()
    db.refresh(trainee)

    print(f"✅ File uploaded to MinIO: {object_name}")
    return trainee   

# GET PHOTO URL
@trainee_router.get("/{trainee_id}/photo-url")
async def get_trainee_photo_url(
    trainee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trainee = get_trainee_by_id(db, trainee_id)
    
    if current_user.role != "admin" and trainee.coach_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нет доступа")
    
    if not trainee.photo_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Фото не найдено")
    
    minio_client = get_minio_client()
    
    photo_url = minio_client.get_public_url(trainee.photo_path)
    
    return {"photo_url": photo_url}

# PATCH
@trainee_router.patch("/{trainee_id}", response_model=TraineeResponse)
def update_trainee(
    trainee_id: int,
    update_data: UpdateTrainee,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        trainee = get_trainee_by_id(db=db, trainee_id=trainee_id)
        if current_user.role != "admin" and trainee.coach_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")
        
        updated_trainee = update_trainee_by_id(db=db, trainee_id=trainee_id, update_data=update_data)
        return updated_trainee
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# DELETE
@trainee_router.delete("/{trainee_id}", response_model=DeleteTraineeResponse)
def delete(
    trainee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        trainee = get_trainee_by_id(db=db, trainee_id=trainee_id)
        if current_user.role != "admin" and trainee.coach_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")
        
        result = delete_trainee(db=db, trainee_id=trainee_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
