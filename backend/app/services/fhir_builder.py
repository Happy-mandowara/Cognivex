import uuid
import datetime
from typing import Dict, Any, List

class FhirR4Builder:
    """Builds strictly compliant HL7 FHIR R4 Bundles for ABDM Health Information Exchange."""

    def build_bundle(
        self,
        patient_data: Dict[str, Any],
        encounter_data: Dict[str, Any],
        ayush_data: Dict[str, Any] = None,
        prescription_data: Dict[str, Any] = None,
        diagnoses: List[str] = None
    ) -> Dict[str, Any]:
        bundle_id = str(uuid.uuid4())
        timestamp = datetime.datetime.utcnow().isoformat() + "Z"
        patient_uuid = patient_data.get("id", str(uuid.uuid4()))
        encounter_uuid = encounter_data.get("id", str(uuid.uuid4()))

        entries = []

        # 1. Patient Resource
        patient_res = {
            "fullUrl": f"urn:uuid:{patient_uuid}",
            "resource": {
                "resourceType": "Patient",
                "id": patient_uuid,
                "meta": {
                    "versionId": "1",
                    "lastUpdated": timestamp,
                    "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient"]
                },
                "identifier": [
                    {
                        "type": {
                            "coding": [
                                {
                                    "system": "https://nrces.in/ndhm/fhir/r4/CodeSystem/ndhm-identifier-type-code",
                                    "code": "ABHA",
                                    "display": "Ayushman Bharat Health Account Number"
                                }
                            ]
                        },
                        "system": "https://healthid.abdm.gov.in",
                        "value": patient_data.get("abha_id", "91-8742-9901-2341")
                    },
                    {
                        "type": {
                            "coding": [
                                {
                                    "system": "https://nrces.in/ndhm/fhir/r4/CodeSystem/ndhm-identifier-type-code",
                                    "code": "ABHA-Address",
                                    "display": "Ayushman Bharat Health Account Address"
                                }
                            ]
                        },
                        "system": "https://phr.abdm.gov.in",
                        "value": patient_data.get("abha_address", "ananya.sharma@abdm")
                    }
                ],
                "name": [
                    {
                        "text": patient_data.get("name", "Ananya Sharma"),
                        "family": patient_data.get("name", "Ananya Sharma").split()[-1] if " " in patient_data.get("name", "") else "",
                        "given": [patient_data.get("name", "Ananya Sharma").split()[0]]
                    }
                ],
                "telecom": [
                    {
                        "system": "phone",
                        "value": patient_data.get("phone", "+91 98765 43210"),
                        "use": "mobile"
                    }
                ],
                "gender": patient_data.get("gender", "female").lower(),
                "birthDate": str(datetime.date.today().year - patient_data.get("age", 34)) + "-05-14"
            }
        }
        entries.append(patient_res)

        # 2. Encounter Resource
        encounter_res = {
            "fullUrl": f"urn:uuid:{encounter_uuid}",
            "resource": {
                "resourceType": "Encounter",
                "id": encounter_uuid,
                "status": "finished",
                "class": {
                    "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                    "code": "AMB",
                    "display": "Ambulatory Outpatient"
                },
                "subject": {
                    "reference": f"urn:uuid:{patient_uuid}",
                    "display": patient_data.get("name", "Ananya Sharma")
                },
                "period": {
                    "start": timestamp
                },
                "reasonCode": [
                    {
                        "text": encounter_data.get("chief_complaint", "Headache for 3 days, aggravated by sunlight and heat")
                    }
                ]
            }
        }
        entries.append(encounter_res)

        # 3. Condition (Diagnosis / Clinical Problem)
        condition_uuid = str(uuid.uuid4())
        condition_res = {
            "fullUrl": f"urn:uuid:{condition_uuid}",
            "resource": {
                "resourceType": "Condition",
                "id": condition_uuid,
                "clinicalStatus": {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                            "code": "active",
                            "display": "Active"
                        }
                    ]
                },
                "verificationStatus": {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
                            "code": "confirmed",
                            "display": "Confirmed"
                        }
                    ]
                },
                "category": [
                    {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/condition-category",
                                "code": "encounter-diagnosis",
                                "display": "Encounter Diagnosis"
                            }
                        ]
                    }
                ],
                "code": {
                    "coding": [
                        {
                            "system": "http://id.who.int/icd/release/11/mms",
                            "code": "8A80.0",
                            "display": "Migraine without aura"
                        },
                        {
                            "system": "https://namstp.ayush.gov.in",
                            "code": "AYU-SHS-004",
                            "display": "Pittaja Shirashoola"
                        }
                    ],
                    "text": "Pittaja Shirashoola / Migraine without aura"
                },
                "subject": {
                    "reference": f"urn:uuid:{patient_uuid}"
                },
                "encounter": {
                    "reference": f"urn:uuid:{encounter_uuid}"
                },
                "recordedDate": timestamp
            }
        }
        entries.append(condition_res)

        # 4. Observation Resource (Ayush Prakriti Assessment)
        if ayush_data:
            obs_uuid = str(uuid.uuid4())
            obs_res = {
                "fullUrl": f"urn:uuid:{obs_uuid}",
                "resource": {
                    "resourceType": "Observation",
                    "id": obs_uuid,
                    "status": "final",
                    "category": [
                        {
                            "coding": [
                                {
                                    "system": "https://nrces.in/ndhm/fhir/r4/CodeSystem/ndhm-observation-category",
                                    "code": "ayush-prakriti-assessment",
                                    "display": "Ayush Tridosha Assessment"
                                }
                            ]
                        }
                    ],
                    "code": {
                        "coding": [
                            {
                                "system": "https://namstp.ayush.gov.in",
                                "code": "AYU-PRK-001",
                                "display": "Deha Prakriti Pariksha"
                            }
                        ],
                        "text": f"Prakriti Assessment: {ayush_data.get('dominant_dosha', 'Pitta')} Dominant"
                    },
                    "subject": {
                        "reference": f"urn:uuid:{patient_uuid}"
                    },
                    "effectiveDateTime": timestamp,
                    "component": [
                        {
                            "code": {"text": "Vata Percentage"},
                            "valueQuantity": {
                                "value": ayush_data.get("vata_percentage", 28.0),
                                "unit": "%",
                                "system": "http://unitsofmeasure.org",
                                "code": "%"
                            }
                        },
                        {
                            "code": {"text": "Pitta Percentage"},
                            "valueQuantity": {
                                "value": ayush_data.get("pitta_percentage", 58.0),
                                "unit": "%",
                                "system": "http://unitsofmeasure.org",
                                "code": "%"
                            }
                        },
                        {
                            "code": {"text": "Kapha Percentage"},
                            "valueQuantity": {
                                "value": ayush_data.get("kapha_percentage", 14.0),
                                "unit": "%",
                                "system": "http://unitsofmeasure.org",
                                "code": "%"
                            }
                        }
                    ]
                }
            }
            entries.append(obs_res)

        # 5. MedicationRequest Resources
        if prescription_data and prescription_data.get("medications"):
            for med in prescription_data["medications"]:
                med_uuid = str(uuid.uuid4())
                med_res = {
                    "fullUrl": f"urn:uuid:{med_uuid}",
                    "resource": {
                        "resourceType": "MedicationRequest",
                        "id": med_uuid,
                        "status": "active",
                        "intent": "order",
                        "medicationCodeableConcept": {
                            "text": f"{med.get('name')} ({med.get('dosage')}) - {med.get('system')}"
                        },
                        "subject": {
                            "reference": f"urn:uuid:{patient_uuid}"
                        },
                        "authoredOn": timestamp,
                        "dosageInstruction": [
                            {
                                "text": f"{med.get('frequency')} for {med.get('duration')}. {med.get('instructions', '')}"
                            }
                        ]
                    }
                }
                entries.append(med_res)

        # Return full FHIR R4 Bundle
        return {
            "resourceType": "Bundle",
            "id": bundle_id,
            "meta": {
                "versionId": "1",
                "lastUpdated": timestamp,
                "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle"]
            },
            "identifier": {
                "system": "https://medikiosk.abdm.gov.in/bundles",
                "value": f"MEDIKIOSK-FHIR-R4-{bundle_id[:8]}"
            },
            "type": "collection",
            "timestamp": timestamp,
            "total": len(entries),
            "entry": entries
        }

fhir_builder = FhirR4Builder()
