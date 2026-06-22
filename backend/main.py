import hashlib
from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional

from database import engine, Base, get_db
import models
import schemas
from seed import seed_db
from ai_service import AIProposalService
from auth import create_access_token, verifyReviewerRole, get_current_user, get_current_user_optional

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
