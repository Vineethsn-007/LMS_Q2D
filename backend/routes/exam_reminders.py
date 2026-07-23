import schemas
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
import datetime
import logging

router = APIRouter(prefix="/api/v1/exam-engine", tags=["Exam Engine API"])
logger = logging.getLogger(__name__)

from services.mailer import MailerService

def _get_utc_dt(dt):
    if not dt:
        return None
    return dt.astimezone(datetime.timezone.utc) if dt.tzinfo else dt.replace(tzinfo=datetime.timezone.utc)

@router.post("/admin/trigger-reminders")
def trigger_reminders(db: Session = Depends(get_db)):
    """Admin endpoint to process active/issued exam sessions and trigger credential delivery and reminders."""
    issued_creds = db.query(models.ExamCredential).filter(models.ExamCredential.status == "issued").all()
    count = 0
    sent_logs = []
    
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    
    import os
    default_fe = "https://skillforge-frontend-r6va.onrender.com" if (os.getenv("RENDER") or os.getenv("RENDER_EXTERNAL_URL") or os.getenv("PORT")) else "http://localhost:3000"
    frontend_url = os.getenv("FRONTEND_URL", default_fe).rstrip("/")
    
    for cred in issued_creds:
        session = db.query(models.ExamSession).filter(models.ExamSession.id == cred.session_id).first()
        if not session:
            continue
            
        user = db.query(models.User).filter(models.User.id == session.student_id).first()
        if not user:
            continue
            
        cred_issued = _get_utc_dt(cred.issued_at)
        cred_expires = _get_utc_dt(cred.expires_at)
        if not cred_issued or not cred_expires:
            continue
            
        link = f"{frontend_url}/exam/take/{cred.temp_user_id}"
        slot_time_str = cred_issued.strftime("%Y-%m-%d %I:%M %p UTC")
        
        # Check 30-minute credential delivery window (within 30 mins before window opens up through window close)
        time_until_window = (cred_issued - now_utc).total_seconds()
        logger.info(f"Checking cred {cred.temp_user_id} for user {user.email}: time_until_window={time_until_window}")
        if -14400 <= time_until_window <= 1800:
            # Check if credential delivery email already sent for this specific temp_user_id
            existing_log = db.query(models.EmailLog).filter(
                models.EmailLog.recipient == user.email,
                models.EmailLog.template_type == "exam_credential",
                models.EmailLog.subject.like(f"%{cred.temp_user_id}%")
            ).first()
            
            if not existing_log:
                success = MailerService.send_exam_credential_email(
                    email=user.email,
                    name=user.name,
                    temp_user_id=cred.temp_user_id,
                    temp_password=cred.temp_password_hash,
                    assessment_link=link,
                    slot_time_str=slot_time_str,
                    db=db
                )
                if success:
                    sent_logs.append({
                        "email": user.email,
                        "type": "exam_credential_delivery",
                        "temp_user_id": cred.temp_user_id,
                        "session_ref": session.session_ref
                    })
                    count += 1
        elif 1800 < time_until_window <= 86400:
            # Check 24-hour reminder check
            existing_rem = db.query(models.EmailLog).filter(
                models.EmailLog.recipient == user.email,
                models.EmailLog.template_type == "exam_reminder",
                models.EmailLog.subject.like(f"%{session.booking_ref}%")
            ).first()
            if not existing_rem:
                success = MailerService.send_exam_reminder_email(
                    email=user.email,
                    name=user.name,
                    level=session.level,
                    booking_ref=session.booking_ref,
                    assessment_link=link,
                    temp_user_id=cred.temp_user_id,
                    db=db
                )
                if success:
                    sent_logs.append({
                        "email": user.email,
                        "type": "exam_reminder",
                        "temp_user_id": cred.temp_user_id,
                        "session_ref": session.session_ref
                    })
                    count += 1
                
    return {"reminders_sent": count, "logs": sent_logs}

