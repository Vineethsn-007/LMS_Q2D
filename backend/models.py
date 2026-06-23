from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="learner")
    is_active = Column(Boolean, default=True)

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

class CourseMaterial(Base):
    __tablename__ = "course_materials"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, index=True, nullable=False)
    title = Column(String, nullable=False)
    type = Column(String, nullable=False)  # 'video', 'text', 'pdf', 'image'
    content_url = Column(String, nullable=True)
    text_content = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

