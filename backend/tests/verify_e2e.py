import httpx as requests
import uuid

ROOT = 'http://127.0.0.1:8000'
BASE = 'http://127.0.0.1:8000/api'

def test_full_flow():
    # 1. Health check
    r = requests.get(f'{ROOT}/')
    assert r.status_code == 200, r.text
    data = r.json()
    assert data == {'name': 'MediKiosk API', 'status': 'online', 'version': '1.0.0', 'docs': '/docs'}
    print('1. Health check passed:', data)

    # 2. Patient Signup
    uid = uuid.uuid4().hex[:6]
    pat_email = f'patient_{uid}@health.org'
    r = requests.post(f'{BASE}/auth/signup', json={
        'name': 'Rajesh Kumar',
        'email': pat_email,
        'password': 'SecurePatientPassword123!',
        'role': 'PATIENT'
    })
    assert r.status_code == 200, r.text
    pat_token = r.json()['access_token']
    pat_patient_id = r.json()['user'].get('patient_id') or 'PAT-TEST'
    pat_headers = {'Authorization': f'Bearer {pat_token}'}
    print('2. Patient signup passed. User ID:', r.json()['user']['id'], 'Patient ID:', pat_patient_id)

    # 3. Patient creates intake
    intake_payload = {
        'patient_id': pat_patient_id,
        'patient_name': 'Rajesh Kumar',
        'age': 42,
        'gender': 'Male',
        'phone': '9876543210',
        'abha_id': '44-5555-6666-7777',
        'chief_complaint': 'Chronic fatigue, acidity and burning sensation after meals',
        'symptoms': ['Fatigue', 'Acidity', 'Gastric burning'],
        'dominant_prakriti': 'Pitta',
        'prakriti_scores': {'vata': 25, 'pitta': 60, 'kapha': 15},
        'vitals': {'bp': '124/82', 'heart_rate': 74, 'temp': 98.4, 'spo2': 99},
        'documents': [{'filename': 'cbc_rajesh.pdf', 'summary': 'Normal CBC with slight elevated bilirubin'}]
    }
    r = requests.post(f'{BASE}/kiosk/intake', json=intake_payload, headers=pat_headers)
    assert r.status_code == 200, r.text
    encounter_id = r.json().get('id') or r.json().get('encounter_id')
    patient_id = r.json().get('patient_id')
    print('3. Patient intake created. Encounter ID:', encounter_id, 'Patient ID:', patient_id)

    # 4. Patient verifies persistence via /patients/me and /patients/my-encounters
    r = requests.get(f'{BASE}/patients/me', headers=pat_headers)
    assert r.status_code == 200
    assert r.json()['name'] == 'Rajesh Kumar'
    r = requests.get(f'{BASE}/patients/my-encounters', headers=pat_headers)
    assert r.status_code == 200
    assert len(r.json()) >= 1
    assert r.json()[0]['id'] == encounter_id
    print('4. Patient persistence verified across refresh/endpoints.')

    # 5. Patient RBAC: cannot access /doctor/queue or /admin/users
    r = requests.get(f'{BASE}/doctor/queue', headers=pat_headers)
    assert r.status_code == 403, f'Expected 403 but got {r.status_code}'
    r = requests.get(f'{BASE}/admin/users', headers=pat_headers)
    assert r.status_code == 403, f'Expected 403 but got {r.status_code}'
    print('5. Patient role isolation verified (HTTP 403 on doctor and admin endpoints).')

    # 6. Doctor Login
    r = requests.post(f'{BASE}/auth/login', json={'email': 'doctor@medikiosk.demo', 'password': 'Doctor!123'})
    assert r.status_code == 200, f"Doctor login failed: {r.text}"
    doc_token = r.json()['access_token']
    doc_headers = {'Authorization': f'Bearer {doc_token}'}
    print('6. Doctor login passed.')

    # 7. Doctor sees Rajesh in queue
    r = requests.get(f'{BASE}/doctor/queue', headers=doc_headers)
    assert r.status_code == 200, f"Queue failed: {r.text}"
    queue = r.json()
    found = any(q['encounter_id'] == encounter_id for q in queue)
    assert found, f'Encounter {encounter_id} not found in doctor queue'
    print('7. Doctor sees patient in active OPD queue.')

    # 8. Doctor edits clinical data (vitals, diagnosis, notes, prescription)
    r = requests.put(f'{BASE}/doctor/encounter/{encounter_id}/vitals', json={
        'vitals': {'bp': '120/80', 'heart_rate': 72, 'spo2': 99, 'temp': 98.6}
    }, headers=doc_headers)
    assert r.status_code == 200
    assert r.json()['vitals']['bp'] == '120/80'

    r = requests.put(f'{BASE}/doctor/encounter/{encounter_id}/diagnosis', json={
        'diagnoses': [
            {'code': 'K21.9', 'name': 'Gastro-esophageal reflux disease without esophagitis', 'system': 'ICD-10'},
            {'code': 'Amlapitta', 'name': 'Amlapitta (Hyperacidity)', 'system': 'NAMASTE'}
        ]
    }, headers=doc_headers)
    assert r.status_code == 200
    assert len(r.json()['diagnosis']) == 2

    r = requests.post(f'{BASE}/doctor/notes/{encounter_id}', json={
        'notes': 'Patient advised dietary modifications, avoid spicy food. Prescribed Kamadudha Rasa.',
        'status': 'VERIFIED'
    }, headers=doc_headers)
    assert r.status_code == 200

    # 9. Verify persistence of doctor edits
    r = requests.get(f'{BASE}/doctor/patient/{encounter_id}', headers=doc_headers)
    assert r.status_code == 200
    case = r.json()
    assert case['encounter']['vitals']['bp'] == '120/80'
    assert len(case['encounter']['diagnosis']) == 2
    assert case['encounter']['status'] == 'COMPLETED'
    assert case['clinical_summary']['is_verified'] is True
    print('8 & 9. Doctor edits (vitals, diagnosis, notes) persisted successfully.')

    # 10. Admin login and user management
    r = requests.post(f'{BASE}/auth/login', json={'email': 'admin@medikiosk.demo', 'password': 'Admin!123'})
    assert r.status_code == 200, f"Admin login failed: {r.text}"
    adm_token = r.json()['access_token']
    adm_headers = {'Authorization': f'Bearer {adm_token}'}

    # Admin deactivates patient
    users = requests.get(f'{BASE}/admin/users', headers=adm_headers).json()
    target_user = next(u for u in users if u['email'] == pat_email)
    target_id = target_user['id']
    r = requests.patch(f'{BASE}/admin/users/{target_id}/status', json={'is_active': False}, headers=adm_headers)
    assert r.status_code == 200
    assert r.json()['is_active'] is False

    # Deactivated patient is now blocked from making requests
    r = requests.get(f'{BASE}/patients/me', headers=pat_headers)
    assert r.status_code == 403

    # Admin updates system settings
    r = requests.put(f'{BASE}/admin/system-settings', json={
        'settings': {'clinic_name': 'Ayush Super-Speciality Hospital', 'auto_sync_abdm': True}
    }, headers=adm_headers)
    assert r.status_code == 200

    r = requests.get(f'{BASE}/admin/system-settings', headers=adm_headers)
    assert r.status_code == 200
    assert r.json()['clinic_name'] == 'Ayush Super-Speciality Hospital'
    print('10. Admin user management and system settings update verified.')

    print('\n>>> ALL 10 COMPREHENSIVE END-TO-END FLOW CHECKS PASSED!')

if __name__ == '__main__':
    test_full_flow()
