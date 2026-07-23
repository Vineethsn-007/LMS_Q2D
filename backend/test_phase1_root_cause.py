import datetime
import uuid
from database import SessionLocal
import models
from routes.exam_credentials import book_slot, verify_credential
from routes.exam_sessions import start_exam_session
import schemas

def demonstrate_root_cause():
    db = SessionLocal()
    try:
        print("=== DEMONSTRATING PHASE 1 ROOT CAUSE ===")
        # 1. Create a future slot 3 days from now
        future_dt = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=3)
        future_date_str = future_dt.strftime("%Y-%m-%d")
        future_time_str = "09:00 AM - 10:00 AM"
        future_iso_str = future_dt.isoformat()
        
        booking_ref = f"BKG-TEST-{uuid.uuid4().hex[:6].upper()}"
        print(f"Booking slot for 3 days in the future: {future_date_str} at {future_time_str} ({future_iso_str})")
        
        # We need a student and subject
        student = db.query(models.User).filter(models.User.role == "learner").first()
        subject = db.query(models.Subject).first()
        if not student or not subject:
            print("No student or subject found in DB to run demonstration.")
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
        print(f"\n[Book Slot Response]:")
        print(f"  success: {res.get('success')}")
        print(f"  link_status: {res.get('link_status')}")
        print(f"  assessment_link: {res.get('assessment_link')}")
        print(f"  message: {res.get('message')}")
        
        # Now let's test verify_credential immediately
        if res.get("assessment_link"):
            temp_user_id = res["assessment_link"].split("/")[-1]
        else:
            # Check DB for created credential
            session = db.query(models.ExamSession).filter(models.ExamSession.booking_ref == booking_ref).first()
            if not session:
                print("No session created.")
                return
            cred = db.query(models.ExamCredential).filter(models.ExamCredential.session_id == session.id).first()
            temp_user_id = cred.temp_user_id if cred else None
            
        print(f"\nAttempting immediate verify_credential for credential ID: {temp_user_id}")
        verify_res = verify_credential(temp_user_id=temp_user_id, db=db)
        print(f"[Verify Credential Response]:")
        print(f"  is_valid: {verify_res.get('is_valid')}")
        print(f"  status: {verify_res.get('status')}")
        print(f"  window_start: {verify_res.get('window_start')}")
        print(f"  window_end: {verify_res.get('window_end')}")
        
        if verify_res.get("is_valid") == True and verify_res.get("status") == "ready":
            print("\nROOT CAUSE CONFIRMED: A slot booked 3 days in the future is immediately reported as 'is_valid=True' / 'ready'!")
            print("The user can start the exam instantly right after booking without any time window gating.")
        else:
            print("\nCredential was not immediately valid.")
            
    finally:
        # Cleanup test data
        session = db.query(models.ExamSession).filter(models.ExamSession.booking_ref == booking_ref).first()
        if session:
            db.query(models.ExamCredential).filter(models.ExamCredential.session_id == session.id).delete()
            db.delete(session)
            db.commit()
        db.close()

if __name__ == "__main__":
    demonstrate_root_cause()
