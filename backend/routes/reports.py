from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth import verifySubAdminOrAdmin, get_subadmin_allowed_institution_ids

router = APIRouter()

def verify_report_access(
    current_user: models.User = Depends(verifySubAdminOrAdmin),
    db: Session = Depends(get_db)
):
    if current_user.role == "admin":
        return current_user
    priv = db.query(models.SubAdminPrivilege).filter(models.SubAdminPrivilege.user_id == current_user.id).first()
    if not priv or (not priv.view_reports and not priv.custom_reports and not priv.enrollment_reports):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: You lack reports and analytics privileges."
        )
    return current_user

@router.get("/engagement", response_model=schemas.EngagementReportResponse)
def get_engagement_report(
    institution_id: Optional[int] = Query(None),
    specialization: Optional[str] = Query(None),
    program: Optional[str] = Query(None),
    current_user: models.User = Depends(verify_report_access),
    db: Session = Depends(get_db)
):
    query = db.query(models.User).filter(models.User.role == "learner")
    
    allowed_ids = get_subadmin_allowed_institution_ids(current_user, db)
    if allowed_ids is not None:
        query = query.filter(models.User.institution_id.in_(allowed_ids))
        
    if institution_id:
        if allowed_ids is not None and institution_id not in allowed_ids:
            raise HTTPException(status_code=403, detail="Not authorized for this institution")
        query = query.filter(models.User.institution_id == institution_id)
        
    if specialization:
        query = query.filter(models.User.specialization == specialization)
    elif program:
        query = query.filter(models.User.specialization.ilike(f"%{program}%"))
        
    students = query.all()
    total = len(students)
    if total == 0:
        return schemas.EngagementReportResponse(
            total_students=0,
            active_students=0,
            inactive_students=0,
            total_goal_hours=0.0,
            total_progress_hours=0.0,
            average_streak=0.0,
            average_xp=0.0,
            completion_rate=0.0,
            total_certificates_issued=0
        )
        
    active = sum(1 for s in students if s.is_active)
    inactive = total - active
    goal_hours = sum(s.weekly_goal_hours or 0.0 for s in students)
    prog_hours = sum(s.weekly_progress_hours or 0.0 for s in students)
    avg_streak = round(sum(s.streak or 0 for s in students) / total, 1)
    avg_xp = round(sum(s.xp_points or 0 for s in students) / total, 1)
    
    comp_rate = min(100.0, round((prog_hours / max(1.0, goal_hours)) * 100.0, 1))
    
    student_id_strs = [str(s.id) for s in students]
    cert_count = db.query(models.Certificate).filter(models.Certificate.user_id.in_(student_id_strs)).count()
    
    return schemas.EngagementReportResponse(
        total_students=total,
        active_students=active,
        inactive_students=inactive,
        total_goal_hours=round(goal_hours, 1),
        total_progress_hours=round(prog_hours, 1),
        average_streak=avg_streak,
        average_xp=avg_xp,
        completion_rate=comp_rate,
        total_certificates_issued=cert_count
    )

@router.get("/enrollment", response_model=schemas.EnrollmentReportResponse)
def get_enrollment_report(
    institution_id: Optional[int] = Query(None),
    specialization: Optional[str] = Query(None),
    current_user: models.User = Depends(verify_report_access),
    db: Session = Depends(get_db)
):
    query = db.query(models.User).filter(models.User.role == "learner")
    
    allowed_ids = get_subadmin_allowed_institution_ids(current_user, db)
    if allowed_ids is not None:
        query = query.filter(models.User.institution_id.in_(allowed_ids))
        
    if institution_id:
        if allowed_ids is not None and institution_id not in allowed_ids:
            raise HTTPException(status_code=403, detail="Not authorized for this institution")
        query = query.filter(models.User.institution_id == institution_id)
        
    if specialization:
        query = query.filter(models.User.specialization == specialization)
        
    students = query.all()
    total = len(students)
    active = sum(1 for s in students if s.is_active)
    inactive = total - active
    
    # Calculate dynamic average subjects per student based on course progress
    avg_subjects = round(sum((s.weekly_progress_hours or 0.0) / 4.0 for s in students) / max(1, total), 1) if total else 0.0
    
    # Pre-fetch all institutions for name mapping
    institutions = db.query(models.Institution).all()
    inst_name_map = {i.id: i.name for i in institutions}
    
    inst_stats = {}
    spec_stats = {}
    
    for s in students:
        i_id = s.institution_id
        if i_id not in inst_stats:
            inst_stats[i_id] = {
                "institution_id": i_id,
                "institution_name": inst_name_map.get(i_id, "Unassigned / Independent"),
                "registered": 0,
                "active": 0,
                "inactive": 0
            }
        inst_stats[i_id]["registered"] += 1
        if s.is_active:
            inst_stats[i_id]["active"] += 1
        else:
            inst_stats[i_id]["inactive"] += 1
            
        spec_name = s.specialization or "General / Undecided"
        spec_stats[spec_name] = spec_stats.get(spec_name, 0) + 1
        
    by_inst = [
        schemas.InstitutionEnrollmentStat(**data) for data in sorted(inst_stats.values(), key=lambda x: x["registered"], reverse=True)
    ]
    by_spec = [
        schemas.SpecializationStat(specialization=k, student_count=v)
        for k, v in sorted(spec_stats.items(), key=lambda x: x[1], reverse=True)
    ]
    
    return schemas.EnrollmentReportResponse(
        total_registered=total,
        total_active=active,
        total_inactive=inactive,
        average_subjects_per_student=avg_subjects,
        by_institution=by_inst,
        by_specialization=by_spec
    )
