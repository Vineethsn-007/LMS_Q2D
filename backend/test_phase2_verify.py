import os
import sys
import datetime
os.environ["SKIP_CREDENTIAL_WINDOW_ENFORCEMENT"] = "false"
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_tests():
    db = SessionLocal()
    try:
        print("=== RUNNING PHASE 2 CREDENTIAL LIFECYCLE TESTS ===")
        now_utc = datetime.datetime.now(datetime.timezone.utc)
        
        # 1. Setup student user and subject
        user = db.query(models.User).filter(models.User.email == "phase2_tester@skillforge.com").first()
        if not user:
            user = models.User(
                name="Phase 2 Tester",
                email="phase2_tester@skillforge.com",
                hashed_password="hashed_pw_test",
                role="student"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
        subject = db.query(models.Subject).first()
        if not subject:
            print("ERROR: No subject found in DB")
            return
            
        # 2. Test 30-Minute Check-in Window Credential Delivery via trigger-reminders
        print("\n--- Test 1: Credential Delivery via trigger-reminders ---")
        slot_dt_ready = now_utc + datetime.timedelta(minutes=20)
        booking_ref_ready = f"REF-READY-{int(now_utc.timestamp())}"
        session_ready = models.ExamSession(
            booking_ref=booking_ref_ready,
            session_ref=f"SESS-READY-{int(now_utc.timestamp())}",
            student_id=user.id,
            subject_id=subject.id,
            level="Beginner",
            status="pending"
        )
        db.add(session_ready)
        
        booking_ready = models.ExamSlotBooking(
            booking_reference=booking_ref_ready,
            user_id=user.id,
            subject_id=subject.id,
            slot_date=slot_dt_ready.strftime("%Y-%m-%d"),
            slot_time=slot_dt_ready.strftime("%H:%M"),
            slot_datetime=slot_dt_ready,
            status="confirmed"
        )
        db.add(booking_ready)
        db.commit()
        db.refresh(session_ready)
        
        cred_ready = models.ExamCredential(
            session_id=session_ready.id,
            temp_user_id=f"SF-READY-{int(now_utc.timestamp())}",
            temp_password_hash="testpass123",
            status="issued",
            issued_at=(slot_dt_ready - datetime.timedelta(minutes=30)),
            expires_at=(slot_dt_ready + datetime.timedelta(hours=4))
        )
        db.add(cred_ready)
        db.commit()
        
        # Call trigger-reminders endpoint
        res = client.post("/api/v1/exam-engine/admin/trigger-reminders")
        assert res.status_code == 200, f"Expected 200 from trigger-reminders, got {res.status_code}: {res.text}"
        data = res.json()
        print(f"Trigger Reminders Response: {data}")
        
        # Check EmailLog for our ready session
        email_log = db.query(models.EmailLog).filter(
            models.EmailLog.recipient == user.email,
            models.EmailLog.template_type == "exam_credential"
        ).order_by(models.EmailLog.id.desc()).first()
        
        assert email_log is not None, "Expected EmailLog entry with template_type='exam_credential'"
        print(f"PASS: Credential delivery email recorded in EmailLog (status: {email_log.status}, subject: '{email_log.subject}')")
        
        # 3. Test 45-Minute Entry Window Expiration
        print("\n--- Test 2: 45-Minute Entry Window Expiration ---")
        slot_dt_expired = now_utc - datetime.timedelta(minutes=50)
        booking_ref_exp = f"REF-EXP-{int(now_utc.timestamp())}"
        session_exp = models.ExamSession(
            booking_ref=booking_ref_exp,
            session_ref=f"SESS-EXP-{int(now_utc.timestamp())}",
            student_id=user.id,
            subject_id=subject.id,
            level="Beginner",
            status="pending"
        )
        db.add(session_exp)
        
        booking_exp = models.ExamSlotBooking(
            booking_reference=booking_ref_exp,
            user_id=user.id,
            subject_id=subject.id,
            slot_date=slot_dt_expired.strftime("%Y-%m-%d"),
            slot_time=slot_dt_expired.strftime("%H:%M"),
            slot_datetime=slot_dt_expired,
            status="confirmed"
        )
        db.add(booking_exp)
        db.commit()
        db.refresh(session_exp)
        
        cred_exp = models.ExamCredential(
            session_id=session_exp.id,
            temp_user_id=f"SF-EXP-{int(now_utc.timestamp())}",
            temp_password_hash="exppass123",
            status="issued",
            issued_at=(slot_dt_expired - datetime.timedelta(minutes=30)),
            expires_at=(slot_dt_expired + datetime.timedelta(hours=4))
        )
        db.add(cred_exp)
        db.commit()
        
        # Verify credential endpoint should detect >45m past slot start without starting and expire it
        verify_res = client.get(f"/api/v1/exam-engine/credentials/{cred_exp.temp_user_id}")
        assert verify_res.status_code == 200
        verify_data = verify_res.json()
        print(f"Verify Response for 50m old pending slot: {verify_data}")
        assert verify_data["status"] == "expired", f"Expected 'expired', got '{verify_data['status']}'"
        assert verify_data["is_valid"] is False, f"Expected is_valid=False, got {verify_data['is_valid']}"
        print("PASS: verify_credential correctly expired slot >45 minutes past start time.")
        
        # Check start_exam_session also blocks entry
        start_res = client.post(f"/api/v1/exam-engine/sessions/{cred_exp.temp_user_id}/start")
        assert start_res.status_code == 403, f"Expected 403 when trying to start expired credential, got {start_res.status_code}"
        print(f"PASS: start_exam_session blocked with 403: {start_res.json()['detail']}")
        
        # 4. Test Credential Regeneration API & Email Delivery
        print("\n--- Test 3: Credential Regeneration & Email Delivery ---")
        regen_res = client.post(f"/api/v1/exam-engine/admin/poc/regenerate-credential/{session_exp.session_ref}")
        assert regen_res.status_code == 200, f"Expected 200 from regenerate-credential, got {regen_res.status_code}: {regen_res.text}"
        regen_data = regen_res.json()
        print(f"Regenerate Response: {regen_data}")
        assert regen_data["success"] is True
        assert "temp_user_id" in regen_data and regen_data["temp_user_id"].startswith("SF-")
        assert regen_data["temp_user_id"] != cred_exp.temp_user_id, "New temp_user_id must be generated!"
        print(f"PASS: Regenerated new temp_user_id: {regen_data['temp_user_id']} and password: {regen_data['temp_password']}")
        
        # Verify fresh email sent via EmailLog
        new_log = db.query(models.EmailLog).filter(
            models.EmailLog.recipient == user.email,
            models.EmailLog.template_type == "exam_credential"
        ).order_by(models.EmailLog.id.desc()).first()
        assert new_log is not None and regen_data["temp_user_id"] in new_log.subject, "New credential should be emailed"
        print("PASS: New credentials delivered via MailerService (logged in EmailLog).")
        
        # Verify new credential is ready to use and session is reset from terminated to pending
        db.refresh(session_exp)
        assert session_exp.status == "pending", f"Expected session reset to pending, got {session_exp.status}"
        
        new_verify_res = client.get(f"/api/v1/exam-engine/credentials/{regen_data['temp_user_id']}")
        assert new_verify_res.status_code == 200
        new_verify_data = new_verify_res.json()
        print(f"Verify response on regenerated credential: {new_verify_data}")
        assert new_verify_data["is_valid"] is True, f"Expected regenerated credential to be valid, got {new_verify_data}"
        assert new_verify_data["status"] == "ready", f"Expected 'ready', got '{new_verify_data['status']}'"
        print("PASS: Regenerated credential successfully verified and ready for exam check-in.")
        
        print("\n=== ALL PHASE 2 TESTS PASSED WITH ACTUAL EVIDENCE! ===")
        
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
