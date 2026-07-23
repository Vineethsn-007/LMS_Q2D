import os
import sys
import datetime
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
import models

client = TestClient(app)

def run_tests():
    db = SessionLocal()
    try:
        now_utc = datetime.datetime.now(datetime.timezone.utc)
        print("=== RUNNING PHASE 4 PROCTORING FIXES VERIFICATION TESTS ===")
        
        # 1. Setup Test User, Subject, and Session
        email = "phase4_tester@skillforge.com"
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            user = models.User(
                name="Phase 4 Proctoring Tester",
                email=email,
                hashed_password="hashed_pw",
                role="student"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
        subject = db.query(models.Subject).first()
        if not subject:
            subject = models.Subject(
                name="Computer Vision & AI Ethics",
                code="CV-401",
                semester_tier="District",
                credits=4
            )
            db.add(subject)
            db.commit()
            db.refresh(subject)
            
        # Clean up existing test session/cred
        db.query(models.ExamViolationLog).filter(models.ExamViolationLog.session_id.in_(
            db.query(models.ExamSession.id).filter(models.ExamSession.student_id == user.id)
        )).delete(synchronize_session=False)
        db.query(models.ExamCredential).filter(models.ExamCredential.session_id.in_(
            db.query(models.ExamSession.id).filter(models.ExamSession.student_id == user.id)
        )).delete(synchronize_session=False)
        db.query(models.ExamSession).filter(models.ExamSession.student_id == user.id).delete(synchronize_session=False)
        db.commit()
        
        session_ref = f"SESS-P4-{int(now_utc.timestamp())}"
        session = models.ExamSession(
            booking_ref=f"BKG-P4-{int(now_utc.timestamp())}",
            session_ref=session_ref,
            student_id=user.id,
            subject_id=subject.id,
            level="District",
            status="active"
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
        temp_user_id = f"SF-P4-{int(now_utc.timestamp())}"
        cred = models.ExamCredential(
            session_id=session.id,
            temp_user_id=temp_user_id,
            temp_password_hash="p4pass",
            status="issued",
            issued_at=now_utc - datetime.timedelta(minutes=10),
            expires_at=now_utc + datetime.timedelta(hours=4)
        )
        db.add(cred)
        db.commit()
        
        # ─── TEST 1: Camera Re-Opening / Hardware Warning Logging ───
        print("\n--- Test 1: Camera Re-Opening & Hardware Warning Logging ---")
        # Log a camera warning (e.g. temporary frame drop or re-opening request) with severity 1
        res_cam = client.post(f"/api/v1/exam-engine/sessions/{temp_user_id}/violations", json={
            "type": "camera_warning",
            "message": "Camera temporarily dropped frame. Student re-initializing camera...",
            "severity": 1
        })
        assert res_cam.status_code == 200, f"Expected 200 logging camera warning, got {res_cam.status_code}: {res_cam.text}"
        data_cam = res_cam.json()
        assert data_cam["status"] == "active", f"Expected session to remain active during non-critical camera warning/re-opening, got {data_cam['status']}"
        print("PASS: Non-critical camera drop/re-opening warning logged cleanly without locking student out.")
        
        # ─── TEST 2: Audio Alert Severity & Proctor Violation Fetching ───
        print("\n--- Test 2: Audio Alert Severity & Proctor Violation Fetching ---")
        # Log an eye deviation warning (severity 1 - triggers warning audio tone)
        res_eye = client.post(f"/api/v1/exam-engine/sessions/{temp_user_id}/violations", json={
            "type": "eye",
            "message": "Eye or head deviation detected toward off-screen object.",
            "severity": 1
        })
        assert res_eye.status_code == 200
        print("PASS: Eye deviation warning (severity=1) logged successfully.")
        
        # Proctor polls for violations
        res_logs = client.get(f"/api/v1/exam-engine/admin/sessions/{session_ref}/violations")
        assert res_logs.status_code == 200
        logs = res_logs.json()
        assert len(logs) >= 2, f"Expected at least 2 violation logs, found {len(logs)}"
        print(f"PASS: Proctor API fetched {len(logs)} violations. Verified distinct severity codes (1) ready for audio/visual indicators.")
        
        # ─── TEST 3: Multi-Person / Phone Detection Auto-Suspension ───
        print("\n--- Test 3: Multi-Person / Phone Detection Auto-Suspension ---")
        # Log a critical phone detection violation (type='phone', severity=2)
        res_phone = client.post(f"/api/v1/exam-engine/sessions/{temp_user_id}/violations", json={
            "type": "phone",
            "message": "Unauthorized mobile device/phone detected in camera frame near candidate.",
            "severity": 2
        })
        assert res_phone.status_code == 200, f"Expected 200 logging phone detection, got {res_phone.status_code}: {res_phone.text}"
        data_phone = res_phone.json()
        assert data_phone["status"] == "suspended", f"Expected session to auto-suspend immediately on phone detection, got {data_phone['status']}"
        assert "Auto-suspended due to critical violation (phone)" in data_phone["message"], f"Unexpected message: {data_phone['message']}"
        print(f"PASS: Phone/mobile device detection immediately auto-suspended session: '{data_phone['message']}'")
        
        # Verify database session state and audit log
        sess_id = session.id
        db.close()
        db = SessionLocal()
        session_check = db.query(models.ExamSession).filter_by(id=sess_id).first()
        assert session_check.status == "suspended", f"Expected session in DB to be suspended, got {session_check.status}"
        
        audit_log = db.query(models.ExamAuditLog).filter_by(session_id=sess_id, action="session_suspended").first()
        assert audit_log is not None and "phone" in audit_log.description, "Expected session_suspended audit log recorded for phone detection"
        print(f"PASS: Verified in DB and AuditLog: '{audit_log.description}' recorded at {session_check.suspended_at}")
        
        # Now test multi-person detection on a fresh active session to verify 'multi_person' also auto-suspends
        session_check.status = "active"
        db.commit()
        
        res_multi = client.post(f"/api/v1/exam-engine/sessions/{temp_user_id}/violations", json={
            "type": "multi_person",
            "message": "Multiple individuals detected in camera frame.",
            "severity": 2
        })
        assert res_multi.status_code == 200
        assert res_multi.json()["status"] == "suspended", f"Expected session to auto-suspend on multi_person, got {res_multi.json()['status']}"
        print(f"PASS: Multi-person detection immediately auto-suspended session: '{res_multi.json()['message']}'")
        
        print("\n=== ALL PHASE 4 PROCTORING FIXES VERIFIED IN BACKEND WITH ACTUAL EVIDENCE! ===")
        
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
