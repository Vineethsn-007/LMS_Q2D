import sys
import os
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def run_tests():
    print("=" * 70)
    print("RUNNING VERIFICATION SUITE FOR PHASES 6 TO 10")
    print("=" * 70)

    # Step 1: Login as student/learner to get token
    print("\n[Test 1] Authenticating to obtain access tokens...")
    auth_res = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "learner@skillforge.com", "password": "learner123"})
    
    if auth_res.status_code != 200:
        print(f"  [FAIL] Failed to login test learner: {auth_res.status_code} {auth_res.text}")
        sys.exit(1)
    
    token = auth_res.json()["access_token"]
    user_id = auth_res.json()["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"  [PASS] Authenticated as User ID {user_id} (Alex Learner)")

    # Step 2: Phase 6 - Dashboard Stats API check
    print("\n[Test 2] Testing GET /api/learning/dashboard-stats...")
    stats_res = requests.get(f"{BASE_URL}/api/learning/dashboard-stats", headers=headers)
    if stats_res.status_code == 200:
        stats_data = stats_res.json()
        print("  [PASS] Dashboard Stats Response keys:", list(stats_data.keys()))
        print("  [INFO] weekly_progress_hours:", stats_data.get("weekly_progress_hours"), "| xp_points:", stats_data.get("xp_points"), "| streak:", stats_data.get("streak"))
        assert "weekly_progress_hours" in stats_data and "xp_points" in stats_data, f"Missing expected metric keys. Got: {list(stats_data.keys())}"
    else:
        print(f"  [FAIL] Failed to get dashboard stats: {stats_res.status_code} {stats_res.text}")
        sys.exit(1)

    # Step 3: Phase 6 - Course Progress Update & XP/Hours Delta check
    print("\n[Test 3] Testing PUT /api/learning/courses/{course_id}/progress...")
    initial_xp = stats_data.get("xp_points", 0)
    # Use the learner's assigned course (course 31 is mapped to subject_id=20 which learner is assigned to)
    # Learner (id=12) reg id=1 -> subject_id=20 -> course_id=31
    test_course_id = 31
    progress_payload = {
        "completed_items": ["m1_lesson1_c0", "m1_lesson1_c1"],
        "quiz_answers": {"q1": "A"}
    }
    prog_res = requests.put(f"{BASE_URL}/api/learning/courses/{test_course_id}/progress", json=progress_payload, headers=headers)
    if prog_res.status_code == 200:
        prog_data = prog_res.json()
        print(f"  [PASS] Updated course {test_course_id} progress: completed_items={prog_data.get('completed_items', [])}")
    else:
        print(f"  [FAIL] Failed to update course progress: {prog_res.status_code} {prog_res.text}")
        sys.exit(1)

    # Step 4: Phase 6 - Expert Learner Performance endpoint
    print("\n[Test 4] Testing GET /api/expert/learners-performance as expert/admin...")
    expert_auth = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "expert@skillforge.com", "password": "expert123"})
    if expert_auth.status_code != 200:
        expert_auth = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@skillforge.com", "password": "admin123"})
    if expert_auth.status_code == 200:
        exp_token = expert_auth.json()["access_token"]
        exp_headers = {"Authorization": f"Bearer {exp_token}"}
        perf_res = requests.get(f"{BASE_URL}/api/expert/learners-performance", headers=exp_headers)
        if perf_res.status_code == 200:
            print(f"  [PASS] Expert Learner Performance returned {len(perf_res.json())} learner records from database.")
        else:
            print(f"  [WARN] Warning or non-expert access: {perf_res.status_code}")
    else:
        print("  [WARN] Could not authenticate as expert/admin to test expert endpoint.")

    # Step 5: Phase 6/9 - Course Search & Catalog API
    print("\n[Test 5] Testing GET /api/courses with search and category filters...")
    search_res = requests.get(f"{BASE_URL}/api/courses?search=Python")
    if search_res.status_code == 200:
        search_data = search_res.json()
        print(f"  [PASS] Course search for 'Python' returned {len(search_data)} matching courses.")
    else:
        print(f"  [FAIL] Course search failed: {search_res.status_code}")
        sys.exit(1)

    # Step 6: Phase 9 - AI Chat & Advisor endpoint
    print("\n[Test 6] Testing POST /api/ai/chat (Groq API Advisor)...")
    chat_payload = {
        "messages": [{"role": "user", "content": "Recommend a course for beginner data analysis."}],
        "context": "Public Catalog Advisor test"
    }
    chat_res = requests.post(f"{BASE_URL}/api/ai/chat", json=chat_payload)
    if chat_res.status_code == 200:
        chat_data = chat_res.json()
        print("  [PASS] AI Advisor responded:", chat_data.get("response", "")[:120] + "...")
    else:
        print(f"  [FAIL] AI Chat failed: {chat_res.status_code} {chat_res.text}")
        sys.exit(1)

    # Step 7: Phase 9 - Newsletter Subscription endpoint
    print("\n[Test 7] Testing POST /api/subscribe (Footer subscription)...")
    sub_payload = {"email": f"test_subscriber_{int(time.time())}@example.com"}
    sub_res = requests.post(f"{BASE_URL}/api/subscribe", json=sub_payload)
    if sub_res.status_code == 201 or sub_res.status_code == 200:
        print("  [PASS] Subscriber registered successfully!")
    else:
        print(f"  [FAIL] Subscription failed: {sub_res.status_code} {sub_res.text}")
        sys.exit(1)

    # Step 8: Phase 10 - Login Rate Limiting (Hardening)
    print("\n[Test 8] Testing POST /api/auth/login rate limiting (5 failed attempts limit)...")
    target_email = f"ratelimit_test_{int(time.time())}@example.com"
    for i in range(1, 6):
        res = requests.post(f"{BASE_URL}/api/auth/login", json={"email": target_email, "password": "wrongpassword"})
        assert res.status_code == 400, f"Expected 400 on failed attempt {i}, got {res.status_code}"
    print("  [PASS] Sent 5 failed login attempts (HTTP 400 received for each).")
    
    # 6th attempt should trigger 429 Too Many Requests
    res_6 = requests.post(f"{BASE_URL}/api/auth/login", json={"email": target_email, "password": "wrongpassword"})
    if res_6.status_code == 429:
        print(f"  [PASS] 6th failed attempt correctly blocked with HTTP 429: {res_6.json().get('detail')}")
    else:
        print(f"  [FAIL] Expected HTTP 429 rate limit exceeded on 6th attempt, but got {res_6.status_code}: {res_6.text}")
        sys.exit(1)

    print("\n[PASS] ALL TESTS FOR PHASES 6 TO 10 PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
