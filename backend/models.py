from sqlalchemy import Column, Integer, String, Text, Boolean, Float
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
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
