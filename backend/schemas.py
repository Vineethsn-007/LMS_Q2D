from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

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
    role: str

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

class CourseProposalCreate(BaseModel):
    course_name: str
    reason_to_learn: str
    skill_level: str
    preferred_learning_style: str
    expected_outcome: str
    additional_notes: Optional[str] = None
    public_voting: bool = False
    learner_id: Optional[int] = None
    learner_name: Optional[str] = None
    profile_image: Optional[str] = None

class CourseProposalResponse(CourseProposalCreate):
    id: int
    status: str
    ai_summary: Optional[str] = None
    ai_category: Optional[str] = None
    risk_level: Optional[str] = None
    demand_score: Optional[int] = None
    ai_recommendation: Optional[str] = None
    duplicate_status: bool = False
    ai_flagged_reason: Optional[str] = None
    created_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    reviewer_feedback: Optional[str] = None
    upvotes: int = 0
    downvotes: int = 0
    comment_count: int = 0
    user_vote: Optional[str] = None

    class Config:
        orm_mode = True

class VoteRequest(BaseModel):
    vote_type: str

class CommentCreate(BaseModel):
    content: str
    parent_comment_id: Optional[int] = None

class CommentResponse(BaseModel):
    id: int
    proposal_id: int
    user_id: int
    parent_comment_id: Optional[int] = None
    content: str
    likes: int
    created_at: datetime
    user_name: str
    user_image: Optional[str] = None

    class Config:
        orm_mode = True

class ProposalStatusUpdate(BaseModel):
    status: str
    rejection_reason: Optional[str] = None
    reviewer_feedback: Optional[str] = None

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime
    action_url: Optional[str] = None
    action_label: Optional[str] = None

    class Config:
        orm_mode = True

class RoleUpdate(BaseModel):
    role: str

class CourseCreateUpdate(BaseModel):
    title: str
    description: str
    category: str
    rating: float
    students_count: int
    hours: int
    is_ai_generated: bool
    is_expert_validated: bool
    image_url: Optional[str] = None

class CourseMaterialCreate(BaseModel):
    title: str
    type: str  # 'video', 'text', 'pdf', 'image'
    content_url: Optional[str] = None
    text_content: Optional[str] = None

class CourseMaterialResponse(CourseMaterialCreate):
    id: int
    course_id: int
    created_at: datetime

    class Config:
        orm_mode = True

