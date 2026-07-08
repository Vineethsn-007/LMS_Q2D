import hashlib
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth import verifyAdminRole, verifySubAdminOrAdmin

router = APIRouter()

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def build_subadmin_response(user: models.User, db: Session):
    priv = db.query(models.SubAdminPrivilege).filter(models.SubAdminPrivilege.user_id == user.id).first()
    accesses = db.query(models.SubAdminInstitutionAccess).filter(models.SubAdminInstitutionAccess.subadmin_id == user.id).all()
    inst_ids = [a.institution_id for a in accesses]
    
    resp = user.__dict__.copy()
    resp["privileges"] = priv
    resp["institution_ids"] = inst_ids
    return resp

@router.get("/me", response_model=schemas.SubAdminResponse)
def get_my_subadmin_profile(
    current_user: models.User = Depends(verifySubAdminOrAdmin),
    db: Session = Depends(get_db)
):
    return build_subadmin_response(current_user, db)

@router.get("", response_model=List[schemas.SubAdminResponse])
def get_all_subadmins(
    current_user: models.User = Depends(verifyAdminRole),
    db: Session = Depends(get_db)
):
    users = db.query(models.User).filter(models.User.role == "sub_admin").order_by(models.User.id.asc()).all()
    return [build_subadmin_response(u, db) for u in users]

@router.post("", response_model=schemas.SubAdminResponse, status_code=status.HTTP_201_CREATED)
def create_subadmin(
    subadmin_in: schemas.SubAdminCreate,
    current_user: models.User = Depends(verifyAdminRole),
    db: Session = Depends(get_db)
):
    existing_user = db.query(models.User).filter(models.User.email == subadmin_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email address already exists."
        )
    
    hashed_pwd = hash_password(subadmin_in.password)
    db_user = models.User(
        email=subadmin_in.email,
        name=subadmin_in.name,
        hashed_password=hashed_pwd,
        role="sub_admin",
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create privilege record
    priv_data = subadmin_in.privileges.model_dump() if subadmin_in.privileges else {}
    db_priv = models.SubAdminPrivilege(
        user_id=db_user.id,
        **priv_data
    )
    db.add(db_priv)
    
    # Bind institution access if provided
    if subadmin_in.institution_ids:
        for inst_id in subadmin_in.institution_ids:
            db.add(models.SubAdminInstitutionAccess(
                subadmin_id=db_user.id,
                institution_id=inst_id
            ))
            
    db.commit()
    return build_subadmin_response(db_user, db)

@router.put("/{user_id}/privileges", response_model=schemas.SubAdminResponse)
def update_subadmin_privileges(
    user_id: int,
    update_in: schemas.SubAdminUpdate,
    current_user: models.User = Depends(verifyAdminRole),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id, models.User.role == "sub_admin").first()
    if not user:
        raise HTTPException(status_code=404, detail="Sub-admin user not found")
        
    if update_in.name:
        user.name = update_in.name
    if update_in.email:
        existing = db.query(models.User).filter(models.User.email == update_in.email, models.User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = update_in.email
    if update_in.password:
        user.hashed_password = hash_password(update_in.password)
        
    # Update or create SubAdminPrivilege
    if update_in.privileges is not None:
        priv = db.query(models.SubAdminPrivilege).filter(models.SubAdminPrivilege.user_id == user_id).first()
        priv_data = update_in.privileges.model_dump()
        if priv:
            for k, v in priv_data.items():
                setattr(priv, k, v)
        else:
            db_priv = models.SubAdminPrivilege(user_id=user_id, **priv_data)
            db.add(db_priv)
            
    # Update Institution Access if provided
    if update_in.institution_ids is not None:
        db.query(models.SubAdminInstitutionAccess).filter(
            models.SubAdminInstitutionAccess.subadmin_id == user_id
        ).delete(synchronize_session=False)
        for inst_id in update_in.institution_ids:
            db.add(models.SubAdminInstitutionAccess(
                subadmin_id=user_id,
                institution_id=inst_id
            ))
            
    db.commit()
    db.refresh(user)
    return build_subadmin_response(user, db)

@router.delete("/{user_id}")
def delete_subadmin(
    user_id: int,
    current_user: models.User = Depends(verifyAdminRole),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id, models.User.role == "sub_admin").first()
    if not user:
        raise HTTPException(status_code=404, detail="Sub-admin user not found")
        
    db.query(models.SubAdminPrivilege).filter(models.SubAdminPrivilege.user_id == user_id).delete(synchronize_session=False)
    db.query(models.SubAdminInstitutionAccess).filter(models.SubAdminInstitutionAccess.subadmin_id == user_id).delete(synchronize_session=False)
    db.delete(user)
    db.commit()
    return {"message": "Sub-admin deleted successfully"}
