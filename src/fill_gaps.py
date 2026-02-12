import os
import json
import time
import certifi

# --- WINDOWS SSL FIX ---
os.environ['SSL_CERT_FILE'] = certifi.where()

from google import genai
from google.genai import types

# --- CONFIGURATION ---
API_KEY = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=API_KEY)

# --- THE MISSING SCENARIOS (P003 & P010) ---
SCENARIOS = [
    {
        "pid": "P003", "age": 45, "sex": "F",
        "complaint": "Neck lump noticed by hairdresser",
        "pmh": "None",
        "orders_text": "TSH, Thyroid Ultrasound",
        "critical_phrase": "r/o thyroid malignancy",
        "results_text": "- TSH: Normal.",
        "loop_status_text": "- Ultrasound: Pending >25 days. Insurance denied prior auth.",
        "diagnosis": "Papillary Thyroid Cancer",
        "primary_hypothesis": "Thyroid malignancy",
        "failure_mode": "Ultrasound delayed due to administrative insurance denial"
    },
    {
        "pid": "P010", "age": 70, "sex": "F",
        "complaint": "UTI symptoms",
        "pmh": "Afib on Warfarin",
        "orders_text": "Bactrim",
        "critical_phrase": "r/o UTI",
        "results_text": "None",
        "loop_status_text": "No INR check",
        "diagnosis": "Bleeding Risk",
        "primary_hypothesis": "Drug Interaction",
        "failure_mode": "Did not check INR while on Bactrim"
    }
]

PROMPT_TEMPLATE = """
You are a medical data generator. Generate a realistic patient case in JSON format.
PATIENT PROFILE: {age}-year-old {sex}. Complaint: {complaint}. PMH: {pmh}.
CLINICAL WORKFLOW: Orders: {orders_text}. CRITICAL PHRASE: "{critical_phrase}".
RESULTS: {results_text}. LOOP STATUS: {loop_status_text}.
GROUND TRUTH: Diagnosis: {diagnosis}. Failure: {failure_mode}.

OUTPUT FORMAT (Strict JSON):
{{
  "patient_id": "{pid}",
  "demographics": {{ "age": {age}, "sex": "{sex}", "mrn": "MRN-{pid}99" }},
  "visit_date": "2024-11-05",
  "clinical_note": {{ "date": "2024-11-05", "provider": "Dr. Martinez", "text": "FULL NOTE including '{critical_phrase}'" }},
  "orders": [ {{ "order_id": "ORD1", "test_name": "String", "status": "pending/completed" }} ],
  "results": [ {{ "result_id": "RES1", "test_name": "String", "full_text": "String" }} ],
  "diagnostic_hypothesis": {{ "primary": "{primary_hypothesis}", "reasoning": "String" }},
  "ground_truth_diagnosis": "{diagnosis}",
  "failure_mode": "{failure_mode}",
  "ai_should_flag": ["String"]
}}
"""

print("🚀 Filling Gaps (P003, P010)...")

for scen in SCENARIOS:
    print(f"🤖 Retrying {scen['pid']}...")
    prompt = PROMPT_TEMPLATE.format(**scen)
    
    try:
        response = client.models.generate_content(
            model="gemini-3-flash-preview", # Trying the base alias again for speed
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        data = json.loads(response.text)
        filename = f"data/patients/patient_{scen['pid']}.json"
        with open(filename, "w") as f:
            json.dump(data, f, indent=2)
        print(f"✅ Saved {filename}")
        
    except Exception as e:
        print(f"❌ Failed again {scen['pid']}: {e}")
        time.sleep(2)