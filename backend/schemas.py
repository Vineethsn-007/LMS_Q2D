from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from typing import Optional, List, Any
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    institution_id: Optional[int] = None
    specialization: Optional[str] = None

class UserCreateByAdmin(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str
    institution_id: Optional[int] = None
    specialization: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserGoogleLogin(BaseModel):
    id_token: str

class UserUpdate(BaseModel):
    email: EmailStr
    name: str
    weekly_goal_hours: float
    password: Optional[str] = None
    institution_id: Optional[int] = None
    specialization: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    is_active: bool
    role: str
    streak: Optional[int] = 0
    xp_points: Optional[int] = 0
    weekly_goal_hours: Optional[float] = 8.0
    weekly_progress_hours: Optional[float] = 0.0
    institution_id: Optional[int] = None
    specialization: Optional[str] = None

    class Config:
        from_attributes = True

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
    modules_data: Optional[List[Any]] = None
    quiz_questions: Optional[List[Any]] = None

    class Config:
        from_attributes = True

class ExpertResponse(BaseModel):
    id: int
    name: str
    role: str
    bio: str
    avatar_url: Optional[str] = None
    courses_validated_count: int

    class Config:
        from_attributes = True

class StatResponse(BaseModel):
    id: int
    key: str
    value: str
    label: str

    class Config:
        from_attributes = True

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
        from_attributes = True

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
        from_attributes = True

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
        from_attributes = True

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Optional[str] = None

class ChatResponse(BaseModel):
    response: str

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
    modules_data: Optional[List[Any]] = None
    quiz_questions: Optional[List[Any]] = None

class CourseMaterialCreate(BaseModel):
    title: str
    type: str
    content_url: Optional[str] = None
    text_content: Optional[str] = None

class CourseMaterialsUpdate(BaseModel):
    video_url: Optional[str] = None
    pdf_url: Optional[str] = None
    image_url: Optional[str] = None
    text_content: Optional[str] = None

class CourseMaterialResponse(CourseMaterialCreate):
    id: int
    course_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class CertificateCreate(BaseModel):
    user_id: int
    course_id: int
    course_name: str
    cert_id: str
    issue_date: str

class CertificateResponse(CertificateCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Course Feedback ---
class CourseFeedbackCreate(BaseModel):
    course_id: int
    rating: int          # 1-5
    title: Optional[str] = None
    comment: str

class CourseFeedbackResponse(BaseModel):
    id: int
    course_id: int
    user_id: Optional[int] = None
    user_name: str
    rating: int
    title: Optional[str] = None
    comment: str
    helpful_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class SubscriberCreate(BaseModel):
    email: str

class SubscriberResponse(BaseModel):
    id: int
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    answer: int

class QuizGenerationRequest(BaseModel):
    count: int = 5
    course_title: Optional[str] = None
    course_description: Optional[str] = None
    modules_data: Optional[List[Any]] = None

class AssessmentQuestion(BaseModel):
    question: str
    options: List[str]
    answer: int
    explanation: Optional[str] = None

class AssessmentTopicRequest(BaseModel):
    topic: str
    difficulty: Optional[str] = "Intermediate"
    count: int = 10

# --- Admin & Sub-Admin Management Schemas ---

class InstitutionCreate(BaseModel):
    name: str
    code: Optional[str] = None
    address: Optional[str] = None
    contact_email: Optional[str] = None

class InstitutionUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    address: Optional[str] = None
    contact_email: Optional[str] = None

class InstitutionResponse(BaseModel):
    id: int
    name: str
    code: Optional[str] = None
    address: Optional[str] = None
    contact_email: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SubAdminPrivilegeCreateUpdate(BaseModel):
    manage_institutions: bool = False
    manage_students: bool = False
    allocate_specializations: bool = False
    view_reports: bool = False
    reset_passwords: bool = False
    bulk_upload: bool = False
    manage_content: bool = False
    custom_reports: bool = False
    enrollment_reports: bool = False

    @field_validator("*", mode="before")
    @classmethod
    def convert_none_to_false(cls, v):
        return False if v is None else v

class SubAdminPrivilegeResponse(SubAdminPrivilegeCreateUpdate):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class SubAdminCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str = "sub_admin"
    privileges: Optional[SubAdminPrivilegeCreateUpdate] = None
    institution_ids: Optional[List[int]] = None

class SubAdminUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    privileges: Optional[SubAdminPrivilegeCreateUpdate] = None
    institution_ids: Optional[List[int]] = None

class SubAdminResponse(UserResponse):
    privileges: Optional[SubAdminPrivilegeResponse] = None
    institution_ids: Optional[List[int]] = None

    class Config:
        from_attributes = True

class SubAdminInstitutionAccessCreate(BaseModel):
    subadmin_id: int
    institution_id: int

class SubAdminInstitutionAccessResponse(BaseModel):
    id: int
    subadmin_id: int
    institution_id: int

    class Config:
        from_attributes = True

# --- Student Management & Bulk Upload Schemas ---

class StudentCreateAdmin(BaseModel):
    email: EmailStr
    name: str
    password: str
    institution_id: Optional[int] = None
    specialization: Optional[str] = None

class StudentUpdateAdmin(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    institution_id: Optional[int] = None
    specialization: Optional[str] = None
    weekly_goal_hours: Optional[float] = None
    is_active: Optional[bool] = None

class StudentPasswordReset(BaseModel):
    new_password: str

class SpecializationAllocation(BaseModel):
    specialization: str

class BulkSpecializationAllocation(BaseModel):
    student_ids: List[int]
    specialization: str

class BulkUploadRowError(BaseModel):
    row: int
    email: Optional[str] = None
    reason: str

class BulkUploadResponse(BaseModel):
    total_rows: int
    success_count: int
    error_count: int
    errors: List[BulkUploadRowError]

# --- Reports & Analytics Schemas ---

class EngagementReportResponse(BaseModel):
    total_students: int
    active_students: int
    inactive_students: int
    total_goal_hours: float
    total_progress_hours: float
    average_streak: float
    average_xp: float
    completion_rate: float
    total_certificates_issued: int

class InstitutionEnrollmentStat(BaseModel):
    institution_id: Optional[int] = None
    institution_name: str
    registered: int
    active: int
    inactive: int

class SpecializationStat(BaseModel):
    specialization: str
    student_count: int

class EnrollmentReportResponse(BaseModel):
    total_registered: int
    total_active: int
    total_inactive: int
    average_subjects_per_student: float
    by_institution: List[InstitutionEnrollmentStat]
    by_specialization: List[SpecializationStat]



