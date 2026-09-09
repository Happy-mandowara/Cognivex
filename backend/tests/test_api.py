import pytest
import uuid
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.core.auth import seed_demo_users
from backend.app.models import models

# Ensure all tables and seed users exist
Base.metadata.create_all(bind=engine)
db = SessionLocal()
seed_demo_users(db)
db.close()

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "MediKiosk API"
    assert data["status"] == "online"
    assert data["version"] == "1.0.0"
    assert data["docs"] == "/docs"

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert "MediKiosk" in data["project"]

def test_auth_login_doctor():
    response = client.post("/api/auth/login", json={
        "email": "doctor@medikiosk.demo",
        "password": "Doctor!123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "DOCTOR"
    assert data["user"]["email"] == "doctor@medikiosk.demo"

def test_auth_login_admin():
    response = client.post("/api/auth/login", json={
        "email": "admin@medikiosk.demo",
        "password": "Admin!123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "ADMIN"

def test_auth_signup_patient():
    unique_email = f"patient_{uuid.uuid4().hex[:6]}@hospital.in"
    response = client.post("/api/auth/signup", json={
        "name": "Rohan Verma",
        "email": unique_email,
        "password": "Password123!",
        "role": "PATIENT"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "PATIENT"
    assert data["user"]["full_name"] == "Rohan Verma"
    assert data["user"]["email"] == unique_email

def test_auth_signup_doctor():
    unique_email = f"dr_{uuid.uuid4().hex[:6]}@hospital.in"
    response = client.post("/api/auth/signup", json={
        "name": "Dr. Priya Patel",
        "email": unique_email,
        "password": "Password123!",
        "role": "DOCTOR"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "DOCTOR"
    assert data["user"]["full_name"] == "Dr. Priya Patel"

def test_auth_signup_admin_forbidden():
    response = client.post("/api/auth/signup", json={
        "name": "Hacker Admin",
        "email": "fakeadmin@hospital.in",
        "password": "Password123!",
        "role": "ADMIN"
    })
    assert response.status_code == 400
    assert "cannot be registered publicly" in response.json()["detail"]

def test_auth_signup_weak_password():
    response = client.post("/api/auth/signup", json={
        "name": "Short Pass User",
        "email": f"short_{uuid.uuid4().hex[:6]}@hospital.in",
        "password": "123",
        "role": "PATIENT"
    })
    assert response.status_code == 400
    assert "too weak" in response.json()["detail"]

def test_auth_signup_duplicate_email():
    response = client.post("/api/auth/signup", json={
        "name": "Duplicate Doctor",
        "email": "doctor@medikiosk.demo",
        "password": "Password123!",
        "role": "DOCTOR"
    })
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_auth_me_and_logout():
    # Login as doctor
    login_res = client.post("/api/auth/login", json={
        "email": "doctor@medikiosk.demo",
        "password": "Doctor!123"
    })
    token = login_res.json()["access_token"]

    # Verify /me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "doctor@medikiosk.demo"
    assert me_res.json()["role"] == "DOCTOR"

    # Verify /logout
    logout_res = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_res.status_code == 200
    assert logout_res.json()["status"] == "SUCCESS"

def test_rbac_admin_stats_allowed_for_admin():
    # Login as admin
    login_res = client.post("/api/auth/login", json={
        "email": "admin@medikiosk.demo",
        "password": "Admin!123"
    })
    token = login_res.json()["access_token"]
    
    # Access admin stats
    stats_res = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "total_patients" in stats
    assert "opd_throughput_rate" in stats

def test_rbac_admin_stats_denied_for_patient():
    # Login as patient
    login_res = client.post("/api/auth/login", json={
        "email": "patient@medikiosk.demo",
        "password": "Patient!123"
    })
    token = login_res.json()["access_token"]
    
    # Attempt to access admin stats
    stats_res = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert stats_res.status_code == 403
    assert "Access denied" in stats_res.json()["detail"]

def test_verify_abha():
    payload = {
        "abha_id": "91-8742-9901-2341",
        "auth_method": "DEMO_OTP",
        "otp": "123456"
    }
    response = client.post("/api/patients/verify-abha", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["milestone"] == "M1_VERIFIED"
    assert data["patient_profile"]["name"] == "Ananya Sharma"

def test_kiosk_configuration():
    response = client.get("/api/kiosk/config")
    assert response.status_code == 200
    data = response.json()
    assert "socrates_questions" in data
    assert "ashtavidha_options" in data
    assert "site" in data["socrates_questions"]

def test_clinical_nlp_extraction():
    payload = {
        "text": "Severe throbbing headache for 3 days, gets much worse in sunlight, accompanied by nausea and photophobia. Severity is 8.",
        "language": "en"
    }
    response = client.post("/api/ai/extract", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert any("Headache" in s for s in data["symptoms"])
    assert data["duration"] == "3 days"
    assert data["severity_score"] == 8
    assert any("Sunlight" in t for t in data["aggravating_factors"])

def test_ayush_prakriti_scoring():
    payload = {
        "body_frame": "moderate",
        "skin_texture": "warm_sensitive",
        "digestion": "strong_acidic",
        "weather_preference": "cool",
        "sleep_pattern": "moderate",
        "mind_nature": "sharp_irritable"
    }
    response = client.post("/api/ayush/prakriti", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["dominant_dosha"] == "Pitta"
    assert data["pitta_percentage"] > 40.0
    assert "Never Autonomously Diagnoses" in data["disclaimer"]

def test_homeopathy_repertorization():
    payload = {
        "symptoms": ["Severe throbbing headache", "Nausea", "Photophobia"],
        "modalities": ["Exposure to sunlight"]
    }
    response = client.post("/api/ayush/repertorize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["top_remedies"]) > 0
    top_names = [r["remedy_name"] for r in data["top_remedies"]]
    assert "Glonoinum" in top_names or "Belladonna" in top_names

def test_one_click_sih_demo():
    response = client.post("/api/demo/run")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["patient"]["name"] == "Ananya Sharma"
    assert data["encounter"]["triage_priority"] == "HIGH"
    assert data["ayush"]["dominant_dosha"] == "Pitta"
    assert "bundle_id" in data["fhir_bundle"]
    assert "M1_ABHA" in data["abdm_status"]
    assert "M2_CONSENT" in data["abdm_status"]
    assert "M3_EXCHANGE" in data["abdm_status"]

def test_abdm_integration_status():
    response = client.get("/api/abdm/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"
    assert "M1_ABHA_CREATION_AND_VERIFICATION" in data["milestones"]

def test_rbac_patient_forbidden_from_doctor_queue():
    # Login as patient
    login_res = client.post("/api/auth/login", json={
        "email": "patient@medikiosk.demo",
        "password": "Patient!123"
    })
    token = login_res.json()["access_token"]

    # Attempt to access doctor queue
    res = client.get("/api/doctor/queue", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]

def test_rbac_patient_forbidden_from_all_patients_list():
    login_res = client.post("/api/auth/login", json={
        "email": "patient@medikiosk.demo",
        "password": "Patient!123"
    })
    token = login_res.json()["access_token"]

    res = client.get("/api/patients", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403

def test_doctor_crud_operations_persistence():
    # 1. Login as doctor
    login_res = client.post("/api/auth/login", json={
        "email": "doctor@medikiosk.demo",
        "password": "Doctor!123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Check queue
    queue_res = client.get("/api/doctor/queue", headers=headers)
    assert queue_res.status_code == 200
    queue = queue_res.json()
    assert len(queue) > 0
    test_enc_id = queue[0]["encounter_id"]
    test_pat_id = queue[0]["patient_id"]

    # 3. Update patient demographics
    update_pat_res = client.put(f"/api/doctor/patient/{test_pat_id}", headers=headers, json={
        "name": "Updated Patient Name",
        "phone": "+91 99999 88888"
    })
    assert update_pat_res.status_code == 200

    # 4. Update vitals
    vitals_res = client.put(f"/api/doctor/encounter/{test_enc_id}/vitals", headers=headers, json={
        "vitals": {"bp": "122/80 mmHg", "pulse": "76 bpm", "temperature": "98.4 °F"}
    })
    assert vitals_res.status_code == 200
    assert vitals_res.json()["vitals"]["bp"] == "122/80 mmHg"

    # 5. Update diagnosis
    diag_res = client.put(f"/api/doctor/encounter/{test_enc_id}/diagnosis", headers=headers, json={
        "diagnoses": [{"code": "8A80.0", "description": "Migraine without aura", "system": "ICD-11", "type": "CONFIRMED"}]
    })
    assert diag_res.status_code == 200
    assert len(diag_res.json()["diagnosis"]) == 1

    # 6. Verify case sheet reflects updates
    case_res = client.get(f"/api/doctor/patient/{test_enc_id}", headers=headers)
    assert case_res.status_code == 200
    sheet = case_res.json()
    assert sheet["patient"]["name"] == "Updated Patient Name"
    assert sheet["encounter"]["vitals"]["bp"] == "122/80 mmHg"
    assert len(sheet["encounter"]["diagnosis"]) == 1

def test_admin_user_deactivation_and_settings():
    # 1. Login as admin
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@medikiosk.demo",
        "password": "Admin!123"
    })
    token = admin_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create a test user to deactivate
    test_email = f"temp_{uuid.uuid4().hex[:6]}@medikiosk.in"
    create_res = client.post("/api/admin/users", headers=headers, json={
        "email": test_email,
        "password": "Password123!",
        "role": "DOCTOR",
        "full_name": "Temporary Doctor"
    })
    assert create_res.status_code == 200
    user_id = create_res.json()["user_id"]

    # 3. Deactivate user
    status_res = client.patch(f"/api/admin/users/{user_id}/status", headers=headers, json={"is_active": False})
    assert status_res.status_code == 200
    assert status_res.json()["is_active"] == False

    # 4. Attempt login with deactivated user -> must fail with 403
    fail_login = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "Password123!"
    })
    # If login issues token, calling /me or protected route returns 403
    temp_token = fail_login.json().get("access_token")
    if temp_token:
        me_check = client.get("/api/auth/me", headers={"Authorization": f"Bearer {temp_token}"})
        assert me_check.status_code == 403
        assert "deactivated" in me_check.json()["detail"]

    # 5. Reactivate user
    status_res2 = client.patch(f"/api/admin/users/{user_id}/status", headers=headers, json={"is_active": True})
    assert status_res2.status_code == 200
    assert status_res2.json()["is_active"] == True

    # 6. Update system settings
    settings_res = client.put("/api/admin/system-settings", headers=headers, json={
        "settings": {"facility_name": "Metro Clinical Hospital", "session_timeout_minutes": "45"}
    })
    assert settings_res.status_code == 200

    # 7. Get system settings and verify persistence
    get_settings = client.get("/api/admin/system-settings", headers=headers)
    assert get_settings.status_code == 200
    assert get_settings.json()["facility_name"] == "Metro Clinical Hospital"

def test_abha_verification_auto_provisions_unlinked_account():
    # Login as admin or new user who has patient_id=None
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@medikiosk.demo",
        "password": "Admin!123"
    })
    token = admin_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Send OTP for 14-digit ABHA ID - should succeed and auto-provision/link patient
    send_res = client.post("/api/abha/send-otp", headers=headers, json={
        "abha_id": "91-8742-9901-2341"
    })
    assert send_res.status_code == 200
    assert send_res.json()["status"] == "OTP_SENT"

    # 2. Verify OTP code
    verify_res = client.post("/api/abha/verify-otp", headers=headers, json={
        "abha_id": "91-8742-9901-2341",
        "otp": "123456"
    })
    assert verify_res.status_code == 200
    data = verify_res.json()
    assert data["status"] == "VERIFIED"
    assert data["is_verified"] is True
    assert "patient" in data
    assert data["patient"]["name"] == "Ananya Sharma"


