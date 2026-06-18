from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    is_active: bool

    class Config:
        orm_mode = True

class CourseResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    rating: float
    students_count: int
    hours: int
    is_ai_generated: bool
    is_expert_validated: bool
    image_url: Optional[str] = None

    class Config:
        orm_mode = True

class ExpertResponse(BaseModel):
    id: int
    name: str
    role: str
    bio: str
    avatar_url: Optional[str] = None
    courses_validated_count: int

    class Config:
        orm_mode = True

class StatResponse(BaseModel):
    id: int
    key: str
    value: str
    label: str

    class Config:
        orm_mode = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
