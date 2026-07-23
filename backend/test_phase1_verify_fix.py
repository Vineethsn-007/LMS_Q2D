import datetime
import uuid
from database import SessionLocal
import models
from routes.exam_credentials import book_slot, verify_credential, trigger_link_webhooks
from routes.exam_sessions import get_session_info, start_exam_session
import schemas
from fastapi import HTTPException

def test_phase1_fix():
    db = SessionLocal()
    booking_ref = f"BKG-VERIFY-{uuid.uuid4().hex[:6].upper()}"
    try:
        print("=== VERIFYING PHASE 1 SLOT BOOKING WINDOW FIX ===")
        # 1. Create a future slot 3 days from now
        future_dt = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=3)
        future_date_str = future_dt.strftime("%Y-%m-%d")
        future_time_str = "09:00 AM - 10:00 AM"
        future_iso_str = future_dt.isoformat()
        
        print(f"\n[Step 1] Booking slot for 3 days in the future: {future_date_str} at {future_time_str}")
        
        student = db.query(models.User).filter(models.User.role == "learner").first()
        subject = db.query(models.Subject).first()
        if not student or not subject:
            print("No student or subject found in DB.")
            return

        req = schemas.SlotBookRequest(
            booking_reference=booking_ref,
            student_id=student.id,
            student_name=student.name,
            student_email=student.email,
            subject_id=subject.id,
            subject_code=subject.code or f"SUB-{subject.id}",
            subject_name=subject.name,
            level="District",
            slot_date=future_date_str,
            slot_time=future_time_str,
            slot_datetime=future_iso_str,
            webhook_callback_url="http://localhost:8000/api/webhooks/exam-engine"
        )
        
        res = book_slot(request=req, db=db)
        print(f"  book_slot result success: {res.get('success')}")
        print(f"  link_status: {res.get('link_status')}")
        
        session = db.query(models.ExamSession).filter(models.ExamSession.booking_ref == booking_ref).first()
        cred = db.query(models.ExamCredential).filter(models.ExamCredential.session_id == session.id).first()
        temp_user_id = cred.temp_user_id
        
        print(f"\n[Step 2] Checking stored credential time window:")
        print(f"  issued_at (window_start): {cred.issued_at}")
        print(f"  expires_at (window_end):  {cred.expires_at}")
        
        # Confirm link via trigger-links or webhook (to simulate what happens when engine provisions link)
        trigger_link_webhooks(db=db)
        booking = db.query(models.ExamSlotBooking).filter(models.ExamSlotBooking.booking_reference == booking_ref).first()
        if booking:
            print(f"  Simulated link readiness: link_status={booking.link_status}, assessment_link={booking.assessment_link}")
            
        print(f"\n[Step 3] Attempting immediate access BEFORE scheduled window:")
        verify_res = verify_credential(temp_user_id=temp_user_id, db=db)
        print(f"  verify_credential -> is_valid: {verify_res.get('is_valid')}, status: {verify_res.get('status')}")
        
        assert verify_res.get("is_valid") == False, "Expected is_valid=False for future slot!"
        assert verify_res.get("status") == "not_yet_available", f"Expected status='not_yet_available', got '{verify_res.get('status')}'"
        
        # Check get_session_info
        try:
            get_session_info(temp_user_id=temp_user_id, db=db)
            assert False, "get_session_info should have raised 403 when accessed early!"
        except HTTPException as e:
            print(f"  get_session_info -> Correctly blocked with 403: {e.detail}")
            assert e.status_code == 403
            
        # Check start_exam_session
        try:
            start_exam_session(temp_user_id=temp_user_id, db=db)
            assert False, "start_exam_session should have raised 403 when accessed early!"
        except HTTPException as e:
            print(f"  start_exam_session -> Correctly blocked with 403: {e.detail}")
            assert e.status_code == 403
            
        print(f"\n[Step 4] Simulating / fast-forwarding time to scheduled slot window...")
        now_utc = datetime.datetime.now(datetime.timezone.utc)
        cred.issued_at = now_utc - datetime.timedelta(minutes=5)  # Window opened 5 minutes ago
        cred.expires_at = now_utc + datetime.timedelta(hours=2)   # Window expires in 2 hours
        db.commit()
        db.refresh(cred)
        
        verify_res_active = verify_credential(temp_user_id=temp_user_id, db=db)
        print(f"  verify_credential -> is_valid: {verify_res_active.get('is_valid')}, status: {verify_res_active.get('status')}")
        assert verify_res_active.get("is_valid") == True, "Expected is_valid=True inside valid time window!"
        assert verify_res_active.get("status") == "ready", f"Expected status='ready', got '{verify_res_active.get('status')}'"
        
        info_res = get_session_info(temp_user_id=temp_user_id, db=db)
        print(f"  get_session_info -> status: {info_res.get('status')}, subject: {info_res.get('subject_name')}")
        assert info_res.get("status") in ("pending", "active"), "Expected session info to return successfully!"
        
        print("\n[PASSED] PHASE 1 VERIFICATION: Strict time window enforcement is functioning perfectly.")
        
    finally:
        session = db.query(models.ExamSession).filter(models.ExamSession.booking_ref == booking_ref).first()
        if session:
            db.query(models.ExamCredential).filter(models.ExamCredential.session_id == session.id).delete()
            db.query(models.ExamSlotBooking).filter(models.ExamSlotBooking.booking_reference == booking_ref).delete()
            db.delete(session)
            db.commit()
        db.close()

if __name__ == "__main__":
    test_phase1_fix()
