from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, JSON
from sqlalchemy.sql import func
from database import Base
from .certificate import Certificate

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="learner")
    is_active = Column(Boolean, default=True)
    streak = Column(Integer, default=0)
    xp_points = Column(Integer, default=0)
    weekly_goal_hours = Column(Float, default=8.0)
    weekly_progress_hours = Column(Float, default=0.0)
    institution_id = Column(Integer, nullable=True, index=True)
    specialization = Column(String, nullable=True, index=True)

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    rating = Column(Float, default=0.0)
    students_count = Column(Integer, default=0)
    hours = Column(Integer, default=0)
    is_ai_generated = Column(Boolean, default=True)
    is_expert_validated = Column(Boolean, default=True)
    image_url = Column(String, nullable=True)
    modules_data = Column(JSON, nullable=True)
    quiz_questions = Column(JSON, nullable=True)

class Expert(Base):
    __tablename__ = "experts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    bio = Column(Text, nullable=False)
    avatar_url = Column(String, nullable=True)
    courses_validated_count = Column(Integer, default=0)

class Stat(Base):
    __tablename__ = "stats"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(String, nullable=False)
    label = Column(String, nullable=False)

class CourseProposal(Base):
    __tablename__ = "course_proposals"

    id = Column(Integer, primary_key=True, index=True)
    course_name = Column(String, nullable=False)
    reason_to_learn = Column(String, nullable=False)
    skill_level = Column(String, nullable=False)
    preferred_learning_style = Column(Text, nullable=False)
    expected_outcome = Column(Text, nullable=False)
    additional_notes = Column(Text, nullable=True)
    public_voting = Column(Boolean, default=False)
    status = Column(String, default="pending")
    learner_id = Column(Integer, nullable=True)
    learner_name = Column(String, nullable=True)
    profile_image = Column(String, nullable=True)
    
    # AI Preprocessing fields
    ai_summary = Column(Text, nullable=True)
    ai_category = Column(String, nullable=True)
    risk_level = Column(String, nullable=True)
    demand_score = Column(Integer, nullable=True)
    ai_recommendation = Column(String, nullable=True)
    duplicate_status = Column(Boolean, default=False)
    ai_flagged_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    rejection_reason = Column(String, nullable=True)
    reviewer_feedback = Column(Text, nullable=True)
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    action_url = Column(String, nullable=True)
    action_label = Column(String, nullable=True)

class ProposalVote(Base):
    __tablename__ = "proposal_votes"

    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, index=True, nullable=False)
    user_id = Column(Integer, index=True, nullable=False)
    vote_type = Column(String, nullable=False)

class ProposalComment(Base):
    __tablename__ = "proposal_comments"

    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, index=True, nullable=False)
    user_id = Column(Integer, index=True, nullable=False)
    parent_comment_id = Column(Integer, index=True, nullable=True)
    content = Column(Text, nullable=False)
    likes = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CourseFeedback(Base):
    __tablename__ = "course_feedback"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, index=True, nullable=False)
    user_id = Column(Integer, index=True, nullable=True)   # nullable for anonymous
    user_name = Column(String, nullable=False)
    rating = Column(Integer, nullable=False)               # 1-5 stars
    title = Column(String, nullable=True)
    comment = Column(Text, nullable=False)
    helpful_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CourseMaterial(Base):
    __tablename__ = "course_materials"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, index=True, nullable=False)
    title = Column(String, nullable=False)
    type = Column(String, nullable=False)  # 'video', 'text', 'pdf', 'image'
    content_url = Column(String, nullable=True)
    text_content = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Subscriber(Base):
    __tablename__ = "subscribers"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    code = Column(String, unique=True, index=True, nullable=True)
    address = Column(Text, nullable=True)
    contact_email = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SubAdminPrivilege(Base):
    __tablename__ = "subadmin_privileges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False, unique=True)
    manage_institutions = Column(Boolean, default=False)
    manage_students = Column(Boolean, default=False)
    allocate_specializations = Column(Boolean, default=False)
    view_reports = Column(Boolean, default=False)
    reset_passwords = Column(Boolean, default=False)
    bulk_upload = Column(Boolean, default=False)
    manage_content = Column(Boolean, default=False)
    custom_reports = Column(Boolean, default=False)
    enrollment_reports = Column(Boolean, default=False)

class SubAdminInstitutionAccess(Base):
    __tablename__ = "subadmin_institution_access"

    id = Column(Integer, primary_key=True, index=True)
    subadmin_id = Column(Integer, index=True, nullable=False)
    institution_id = Column(Integer, index=True, nullable=False)

