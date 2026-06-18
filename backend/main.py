import hashlib
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional

from database import engine, Base, get_db
import models
import schemas
from seed import seed_db

# Initialize database tables and run seed if database is empty
Base.metadata.create_all(bind=engine)
db = next(get_db())
try:
    if db.query(models.Course).count() == 0:
        print("Database empty. Seeding starter data...")
        seed_db()
finally:
    db.close()

app = FastAPI(title="SkillForge LMS API", version="1.0.0")

# Configure CORS to allow the React development server to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@app.get("/")
def read_root():
    return {"message": "Welcome to the SkillForge LMS API. Access docs at /docs"}

# Stats endpoint
@app.get("/api/stats", response_model=List[schemas.StatResponse])
def get_stats(db: Session = Depends(get_db)):
    stats = db.query(models.Stat).all()
    return stats

# Courses endpoint with filter and search capabilities
@app.get("/api/courses", response_model=List[schemas.CourseResponse])
def get_courses(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Course)
    
    if category and category != "All":
        query = query.filter(models.Course.category == category)
        
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (models.Course.title.ilike(search_filter)) | 
            (models.Course.description.ilike(search_filter))
        )
        
    return query.all()

# Experts endpoint
@app.get("/api/experts", response_model=List[schemas.ExpertResponse])
def get_experts(db: Session = Depends(get_db)):
    experts = db.query(models.Expert).all()
    return experts

# Auth Register
@app.post("/api/auth/register", response_model=schemas.TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email address already exists."
        )
    
    # Create new user
    hashed_pwd = hash_password(user_in.password)
    db_user = models.User(
        email=user_in.email,
        name=user_in.name,
        hashed_password=hashed_pwd
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Return mock token
    token = f"mock-jwt-token-for-{db_user.email}"
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": db_user
    }

# Auth Login
@app.post("/api/auth/login", response_model=schemas.TokenResponse)
def login(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if not db_user:
        raise HTTPException(
            status_code=400,
            detail="Invalid email or password."
        )
    
    # Verify password
    hashed_pwd = hash_password(user_in.password)
    if db_user.hashed_password != hashed_pwd:
        raise HTTPException(
            status_code=400,
            detail="Invalid email or password."
        )
        
    # Return mock token
    token = f"mock-jwt-token-for-{db_user.email}"
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": db_user
    }
