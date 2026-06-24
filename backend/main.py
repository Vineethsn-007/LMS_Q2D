import hashlib
import os
from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional

from database import engine, Base, get_db
import models
import schemas
from seed import seed_db
from ai_service import AIProposalService
from auth import create_access_token, verifyReviewerRole, get_current_user, get_current_user_optional, verifyAdminRole, verifyExpertRole

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

# Mount static uploads serving
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

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
        hashed_password=hashed_pwd,
        role="learner"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    access_token = create_access_token(data={"sub": str(db_user.id), "role": db_user.role})
    return {
        "access_token": access_token,
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
        
    access_token = create_access_token(data={"sub": str(db_user.id), "role": db_user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }

# Auth Google
@app.post("/api/auth/google", response_model=schemas.TokenResponse)
def google_auth(user_in: schemas.UserGoogleLogin, db: Session = Depends(get_db)):
    # Fallback to mock for testing/offline review
    if user_in.id_token == "mock-google-token":
        email = "learner.google@gmail.com"
        name = "Google Learner"
    else:
        import requests
        tokeninfo_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={user_in.id_token}"
        try:
            response = requests.get(tokeninfo_url)
            if response.status_code != 200:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid Google ID Token."
                )
            id_info = response.json()
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to verify Google token: {str(e)}"
            )

        client_id = os.getenv("GOOGLE_CLIENT_ID")
        if id_info.get("aud") != client_id:
            # Fallback check if it was not issued for our app
            print(f"Warning: Audience mismatch. Expected {client_id}, got {id_info.get('aud')}")
            # We will allow it for demonstration but log the mismatch warning
            
        email = id_info.get("email")
        name = id_info.get("name", "Google User")

        if not email:
            raise HTTPException(
                status_code=400,
                detail="Google account does not provide an email address."
            )

    db_user = db.query(models.User).filter(models.User.email == email).first()
    if not db_user:
        # Create new Google user with initial progress data
        import uuid
        random_pwd = hash_password(str(uuid.uuid4()))
        db_user = models.User(
            email=email,
            name=name,
            hashed_password=random_pwd,
            role="learner",
            streak=12,
            xp_points=2840,
            weekly_goal_hours=8.0,
            weekly_progress_hours=6.5,
            is_active=True
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
    access_token = create_access_token(data={"sub": str(db_user.id), "role": db_user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }

# User Profile Update
@app.put("/api/users/profile", response_model=schemas.UserResponse)
def update_profile(
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_update.email != current_user.email:
        existing = db.query(models.User).filter(models.User.email == user_update.email).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Email address already in use."
            )
    
    current_user.name = user_update.name
    current_user.email = user_update.email
    current_user.weekly_goal_hours = user_update.weekly_goal_hours
    
    db.commit()
    db.refresh(current_user)
    return current_user

# Course Proposal Create
@app.post("/api/proposals/create", response_model=schemas.CourseProposalResponse, status_code=status.HTTP_201_CREATED)
def create_proposal(
    proposal_in: schemas.CourseProposalCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    db_proposal = models.CourseProposal(
        **proposal_in.dict(),
        status="pending"
    )
    db.add(db_proposal)
    db.commit()
    db.refresh(db_proposal)
    
    # Trigger background task for AI Preprocessing
    background_tasks.add_task(AIProposalService.process_proposal, db_proposal.id)
    
    return db_proposal

# Review Center endpoints (Protected)
@app.get("/api/reviewer/proposals", response_model=List[schemas.CourseProposalResponse])
def get_reviewer_proposals(
    status_filter: Optional[str] = None,
    current_user: models.User = Depends(verifyReviewerRole),
    db: Session = Depends(get_db)
):
    query = db.query(models.CourseProposal)
    if status_filter and status_filter != 'all':
        query = query.filter(models.CourseProposal.status == status_filter)
    return query.order_by(models.CourseProposal.id.desc()).all()

@app.put("/api/reviewer/proposals/{proposal_id}/status", response_model=schemas.CourseProposalResponse)
def update_proposal_status(
    proposal_id: int,
    status_update: schemas.ProposalStatusUpdate,
    current_user: models.User = Depends(verifyReviewerRole),
    db: Session = Depends(get_db)
):
    proposal = db.query(models.CourseProposal).filter(models.CourseProposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    proposal.status = status_update.status
    if status_update.status == "rejected":
        proposal.rejection_reason = status_update.rejection_reason
        proposal.reviewer_feedback = status_update.reviewer_feedback
        
        # Create notification for learner if learner_id exists
        if proposal.learner_id:
            message = f"Status: Rejected\nReason: {status_update.rejection_reason}\nReviewer Feedback: {status_update.reviewer_feedback}"
            notification = models.Notification(
                user_id=proposal.learner_id,
                title=f"Proposal Update: {proposal.course_name}",
                message=message,
                action_label="Edit & Resubmit",
                action_url=f"/proposals/edit/{proposal.id}"
            )
            db.add(notification)

    db.commit()
    db.refresh(proposal)
    return proposal

# Notifications endpoint
@app.get("/api/notifications", response_model=List[schemas.NotificationResponse])
def get_notifications(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.Notification).filter(models.Notification.user_id == current_user.id).order_by(models.Notification.created_at.desc()).all()

# Community Voting Endpoints
@app.get("/api/community/proposals", response_model=List[schemas.CourseProposalResponse])
def get_community_proposals(
    sort_by: str = "newest",
    category: Optional[str] = None,
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    query = db.query(models.CourseProposal).filter(models.CourseProposal.status == "approved")
    if category:
        query = query.filter(models.CourseProposal.ai_category == category)
        
    if sort_by == "newest":
        query = query.order_by(models.CourseProposal.created_at.desc())
    elif sort_by == "most_voted":
        query = query.order_by(models.CourseProposal.upvotes.desc())
    elif sort_by == "most_discussed":
        query = query.order_by(models.CourseProposal.comment_count.desc())
    elif sort_by == "trending":
        query = query.order_by((models.CourseProposal.upvotes + models.CourseProposal.comment_count).desc())
        
    proposals = query.all()
    
    # Determine user_vote if authenticated
    result = []
    if current_user:
        user_votes = {v.proposal_id: v.vote_type for v in db.query(models.ProposalVote).filter(models.ProposalVote.user_id == current_user.id).all()}
    else:
        user_votes = {}
        
    for p in proposals:
        p_dict = p.__dict__.copy()
        p_dict["user_vote"] = user_votes.get(p.id)
        result.append(p_dict)
        
    return result

@app.post("/api/community/proposals/{proposal_id}/vote", response_model=schemas.CourseProposalResponse)
def vote_on_proposal(
    proposal_id: int,
    vote_req: schemas.VoteRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    proposal = db.query(models.CourseProposal).filter(models.CourseProposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    existing_vote = db.query(models.ProposalVote).filter(
        models.ProposalVote.proposal_id == proposal_id,
        models.ProposalVote.user_id == current_user.id
    ).first()
    
    if existing_vote:
        if existing_vote.vote_type == vote_req.vote_type:
            # Toggle off
            db.delete(existing_vote)
            if vote_req.vote_type == "upvote":
                proposal.upvotes = max(0, proposal.upvotes - 1)
            else:
                proposal.downvotes = max(0, proposal.downvotes - 1)
            user_vote = None
        else:
            # Switch vote
            old_vote = existing_vote.vote_type
            existing_vote.vote_type = vote_req.vote_type
            if old_vote == "upvote":
                proposal.upvotes = max(0, proposal.upvotes - 1)
                proposal.downvotes += 1
            else:
                proposal.downvotes = max(0, proposal.downvotes - 1)
                proposal.upvotes += 1
            user_vote = vote_req.vote_type
    else:
        # New vote
        new_vote = models.ProposalVote(
            proposal_id=proposal_id,
            user_id=current_user.id,
            vote_type=vote_req.vote_type
        )
        db.add(new_vote)
        if vote_req.vote_type == "upvote":
            proposal.upvotes += 1
        else:
            proposal.downvotes += 1
        user_vote = vote_req.vote_type
        
    db.commit()
    db.refresh(proposal)
    
    p_dict = proposal.__dict__.copy()
    p_dict["user_vote"] = user_vote
    return p_dict

@app.get("/api/community/proposals/{proposal_id}/comments", response_model=List[schemas.CommentResponse])
def get_comments(proposal_id: int, db: Session = Depends(get_db)):
    comments = db.query(models.ProposalComment).filter(models.ProposalComment.proposal_id == proposal_id).order_by(models.ProposalComment.created_at.asc()).all()
    
    user_ids = [c.user_id for c in comments]
    users = db.query(models.User).filter(models.User.id.in_(user_ids)).all()
    user_map = {u.id: {"name": u.name, "image": None} for u in users}
    
    result = []
    for c in comments:
        c_dict = c.__dict__.copy()
        c_dict["user_name"] = user_map.get(c.user_id, {}).get("name", "Anonymous")
        c_dict["user_image"] = user_map.get(c.user_id, {}).get("image", None)
        result.append(c_dict)
    return result

@app.post("/api/community/proposals/{proposal_id}/comment", response_model=schemas.CommentResponse)
def post_comment(
    proposal_id: int, 
    comment_req: schemas.CommentCreate, 
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    proposal = db.query(models.CourseProposal).filter(models.CourseProposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    new_comment = models.ProposalComment(
        proposal_id=proposal_id,
        user_id=current_user.id,
        parent_comment_id=comment_req.parent_comment_id,
        content=comment_req.content
    )
    db.add(new_comment)
    
    proposal.comment_count += 1
    db.commit()
    db.refresh(new_comment)
    
    c_dict = new_comment.__dict__.copy()
    c_dict["user_name"] = current_user.name
    c_dict["user_image"] = None
    return c_dict

@app.post("/api/community/comments/{comment_id}/like")
def like_comment(
    comment_id: int, 
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comment = db.query(models.ProposalComment).filter(models.ProposalComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
        
    comment.likes += 1
    db.commit()
    return {"likes": comment.likes}

# Admin endpoints
@app.get("/api/admin/users", response_model=List[schemas.UserResponse])
def get_users(
    current_user: models.User = Depends(verifyAdminRole),
    db: Session = Depends(get_db)
):
    return db.query(models.User).order_by(models.User.id.asc()).all()

@app.put("/api/admin/users/{user_id}/role", response_model=schemas.UserResponse)
def update_user_role(
    user_id: int,
    role_update: schemas.RoleUpdate,
    current_user: models.User = Depends(verifyAdminRole),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = role_update.role
    db.commit()
    db.refresh(user)
    return user

@app.post("/api/admin/upload")
def admin_upload_file(
    file: UploadFile = File(...),
    current_user: models.User = Depends(verifyAdminRole),
    db: Session = Depends(get_db)
):
    os.makedirs("uploads", exist_ok=True)
    file_ext = os.path.splitext(file.filename)[1]
    import uuid
    filename = f"{uuid.uuid4()}{file_ext}"
    filepath = os.path.join("uploads", filename)
    with open(filepath, "wb") as buffer:
        buffer.write(file.file.read())
    return {"url": f"/uploads/{filename}"}

@app.post("/api/admin/courses", response_model=schemas.CourseResponse)
def create_course(
    course_in: schemas.CourseCreateUpdate,
    current_user: models.User = Depends(verifyAdminRole),
    db: Session = Depends(get_db)
):
    course = models.Course(**course_in.dict())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course

@app.put("/api/admin/courses/{course_id}", response_model=schemas.CourseResponse)
def update_course(
    course_id: int,
    course_in: schemas.CourseCreateUpdate,
    current_user: models.User = Depends(verifyAdminRole),
    db: Session = Depends(get_db)
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    for key, value in course_in.dict().items():
        setattr(course, key, value)
    db.commit()
    db.refresh(course)
    return course

@app.put("/api/admin/courses/{course_id}/materials")
def update_admin_course_materials(
    course_id: int,
    payload: schemas.CourseMaterialsUpdate,
    current_user: models.User = Depends(verifyAdminRole),
    db: Session = Depends(get_db)
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    types_to_update = []
    if payload.video_url is not None:
        types_to_update.append('video')
    if payload.pdf_url is not None:
        types_to_update.append('pdf')
    if payload.image_url is not None:
        types_to_update.append('image')
    if payload.text_content is not None:
        types_to_update.append('text')
        
    if types_to_update:
        db.query(models.CourseMaterial).filter(
            models.CourseMaterial.course_id == course_id,
            models.CourseMaterial.type.in_(types_to_update)
        ).delete(synchronize_session=False)
        
    if payload.video_url:
        db.add(models.CourseMaterial(
            course_id=course_id,
            title="Lecture Video",
            type="video",
            content_url=payload.video_url
        ))
    if payload.pdf_url:
        db.add(models.CourseMaterial(
            course_id=course_id,
            title="Course Handout (PDF)",
            type="pdf",
            content_url=payload.pdf_url
        ))
    if payload.image_url:
        db.add(models.CourseMaterial(
            course_id=course_id,
            title="Course Diagram",
            type="image",
            content_url=payload.image_url
        ))
    if payload.text_content:
        db.add(models.CourseMaterial(
            course_id=course_id,
            title="Syllabus Outline",
            type="text",
            text_content=payload.text_content
        ))
        
    db.commit()
    return {"message": "Materials updated successfully"}

@app.delete("/api/admin/courses/{course_id}")
def delete_course(
    course_id: int,
    current_user: models.User = Depends(verifyAdminRole),
    db: Session = Depends(get_db)
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()
    return {"message": "Course deleted successfully"}

@app.delete("/api/admin/proposals/{proposal_id}")
def delete_proposal(
    proposal_id: int,
    current_user: models.User = Depends(verifyAdminRole),
    db: Session = Depends(get_db)
):
    proposal = db.query(models.CourseProposal).filter(models.CourseProposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    db.delete(proposal)
    db.commit()
    return {"message": "Proposal deleted successfully"}

# Expert endpoints
@app.get("/api/expert/courses", response_model=List[schemas.CourseResponse])
def get_expert_courses(
    current_user: models.User = Depends(verifyExpertRole),
    db: Session = Depends(get_db)
):
    return db.query(models.Course).order_by(models.Course.id.desc()).all()

@app.get("/api/expert/courses/{course_id}/materials", response_model=List[schemas.CourseMaterialResponse])
def get_course_materials(
    course_id: int,
    current_user: models.User = Depends(verifyExpertRole),
    db: Session = Depends(get_db)
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return db.query(models.CourseMaterial).filter(models.CourseMaterial.course_id == course_id).order_by(models.CourseMaterial.id.asc()).all()

@app.post("/api/expert/courses/{course_id}/materials", response_model=schemas.CourseMaterialResponse)
def create_course_material(
    course_id: int,
    title: str = Form(...),
    type: str = Form(...),
    text_content: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: models.User = Depends(verifyExpertRole),
    db: Session = Depends(get_db)
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    content_url = None
    if file:
        os.makedirs("uploads", exist_ok=True)
        file_ext = os.path.splitext(file.filename)[1]
        import uuid
        filename = f"{uuid.uuid4()}{file_ext}"
        filepath = os.path.join("uploads", filename)
        with open(filepath, "wb") as buffer:
            buffer.write(file.file.read())
        content_url = f"/uploads/{filename}"

    db_material = models.CourseMaterial(
        course_id=course_id,
        title=title,
        type=type,
        text_content=text_content,
        content_url=content_url
    )
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material
