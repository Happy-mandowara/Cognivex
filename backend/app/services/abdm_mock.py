import uuid
import hashlib
import datetime
from typing import Dict, Any

class MockAbdmGateway:
    """Simulates Ayushman Bharat Digital Mission (ABDM) M1, M2, and M3 workflows."""

    def verify_abha(self, abha_id: str, otp: str = "123456") -> Dict[str, Any]:
        """Milestone 1: ABHA Verification & Profile Linking."""
        is_valid = True if abha_id else False
        clean_abha = abha_id.strip() if abha_id else "91-8742-9901-2341"
        
        return {
            "status": "SUCCESS",
            "milestone": "M1_VERIFIED",
            "abha_number": clean_abha if "@" not in clean_abha else "91-8742-9901-2341",
            "abha_address": clean_abha if "@" in clean_abha else f"{clean_abha.replace('-', '')}@abdm",
            "auth_method": "DEMO_OTP",
            "kyc_verified": True,
            "patient_profile": {
                "name": "Ananya Sharma",
                "gender": "Female",
                "dob": "1992-05-14",
                "age": 34,
                "mobile": "+91 98765 43210",
                "state": "Delhi",
                "district": "New Delhi"
            },
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
        }

    def generate_consent_artefact(self, patient_id: str, abha_address: str, hiu_id: str = "MEDIKIOSK_OPD_01") -> Dict[str, Any]:
        """Milestone 2: ABDM Consent Management & Electronic Artefact Creation."""
        consent_id = f"ABDM-CONSENT-{str(uuid.uuid4())[:8].upper()}"
        now = datetime.datetime.utcnow()
        expiry = now + datetime.timedelta(days=30)
        
        signature_base = f"{consent_id}:{patient_id}:{hiu_id}:{now.isoformat()}"
        digital_signature = hashlib.sha256(signature_base.encode()).hexdigest()

        return {
            "status": "GRANTED",
            "milestone": "M2_CONSENT_GRANTED",
            "consent_id": consent_id,
            "patient_id": patient_id,
            "abha_address": abha_address,
            "hiu_id": hiu_id,
            "hip_id": "MEDIKIOSK_AYUSH_HIP_01",
            "purpose": {
                "code": "CAREST",
                "text": "Care Context Consultation & Clinical Case-Taking History"
            },
            "hi_types": ["OPConsultation", "Prescription", "DiagnosticReport", "AyushAssessment"],
            "date_range": {
                "from": (now - datetime.timedelta(days=365)).strftime("%Y-%m-%d"),
                "to": now.strftime("%Y-%m-%d")
            },
            "permission": {
                "access_mode": "VIEW",
                "date_range": {
                    "from": now.isoformat() + "Z",
                    "to": expiry.isoformat() + "Z"
                },
                "data_erase_at": (expiry + datetime.timedelta(days=1)).isoformat() + "Z"
            },
            "signature": f"SHA256withRSA:{digital_signature[:32]}...",
            "created_at": now.isoformat() + "Z"
        }

    def simulate_data_exchange(self, consent_id: str, fhir_bundle: Dict[str, Any]) -> Dict[str, Any]:
        """Milestone 3: Health Information Exchange (HIU-HIP encrypted payload transfer)."""
        transaction_id = str(uuid.uuid4())
        encryption_key = hashlib.sha256(transaction_id.encode()).hexdigest()[:16]

        return {
            "status": "DISPATCHED_TO_HIS",
            "milestone": "M3_DATA_EXCHANGED",
            "transaction_id": transaction_id,
            "consent_id": consent_id,
            "encryption_protocol": "ECDH-X25519-AES-GCM",
            "key_exchange_token": f"KEY-EXCH-{encryption_key}",
            "records_transferred": fhir_bundle.get("total", 0),
            "target_system": "Hospital Information System (HIS) / ABDM Health Repository",
            "delivered_at": datetime.datetime.utcnow().isoformat() + "Z",
            "integration_health": {
                "gateway_latency_ms": 42,
                "fhir_validation_status": "VALID_R4",
                "abdm_compliance_level": "M1_M2_M3_COMPLETE"
            }
        }

mock_abdm_gateway = MockAbdmGateway()
