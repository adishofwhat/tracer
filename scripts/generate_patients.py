import os
import json
import time
import certifi  # Fixes Windows SSL issues

# --- WINDOWS PERMISSION FIX ---
os.environ['SSL_CERT_FILE'] = certifi.where()

from google import genai
from google.genai import types

# --- CONFIGURATION ---
API_KEY = os.environ.get("GEMINI_API_KEY")

if not API_KEY:
    print("❌ Error: GEMINI_API_KEY is not set.")
    print("Run this in your terminal: export GEMINI_API_KEY='your_key_here'")
    exit(1)

# Initialize Client
client = genai.Client(api_key=API_KEY)

# Ensure directory exists
os.makedirs("data/patients", exist_ok=True)

# --- THE PROMPT TEMPLATE ---
PROMPT_TEMPLATE = """
You are a medical data generator creating realistic synthetic patient cases for a healthcare AI demo. Generate a complete patient case in JSON format.

PATIENT PROFILE:
- {age}-year-old {sex}
- Chief complaint: {complaint}
- PMH: {pmh}

CLINICAL WORKFLOW:
1. Initial PCP visit (2 weeks ago)
2. Orders placed: {orders_text}
3. Some results returned, but gaps exist

CLINICAL NOTE (from PCP visit):
Write a realistic clinical note that includes:
- Subjective: Patient's complaints
- Objective: Vital signs, exam findings
- Assessment: Physician's diagnostic reasoning
- Plan: Orders placed
- CRITICAL: Must include phrase "{critical_phrase}"

RESULTS (1 week later):
{results_text}

DIAGNOSTIC LOOP STATUS:
{loop_status_text}

GROUND TRUTH:
- Actual diagnosis: {diagnosis}
- The failure: {failure_mode}

OUTPUT FORMAT:
Generate JSON with this exact structure:
{{
  "patient_id": "{pid}",
  "demographics": {{ "age": {age}, "sex": "{sex}", "mrn": "MRN-{pid}99" }},
  "visit_date": "2024-11-05",
  "clinical_note": {{
    "date": "2024-11-05",
    "provider": "Dr. Martinez, Juan",
    "text": "[FULL CLINICAL NOTE TEXT HERE]"
  }},
  "orders": [
    {{ "order_id": "ORD001", "test_name": "String", "status": "completed", "result_date": "2024-11-07" }},
    {{ "order_id": "ORD004", "test_name": "String", "status": "pending", "days_pending": 14, "failure_reason": "String" }}
  ],
  "results": [
    {{ "result_id": "RES001", "test_name": "String", "result_date": "2024-11-07", "interpretation": "String", "full_text": "String" }}
  ],
  "diagnostic_hypothesis": {{
    "primary": "{primary_hypothesis}",
    "differential": ["String", "String"],
    "reasoning": "String"
  }},
  "ground_truth_diagnosis": "{diagnosis}",
  "failure_mode": "{failure_mode}",
  "ai_should_flag": ["String", "String"]
}}
"""

# --- THE 10 SCENARIOS ---
SCENARIOS = [
    {
        "pid": "P001", "age": 58, "sex": "F",
        "complaint": "Fatigue and unintentional weight loss (12 lbs)",
        "pmh": "Hypertension, Type 2 diabetes, Family hx colon cancer",
        "orders_text": "CBC, CMP, chest X-ray, colonoscopy referral",
        "critical_phrase": "r/o colon cancer",
        "results_text": "- CBC: Hgb 9.8 (Low), MCV 72 (Low). \n- CXR: Mild mediastinal lymphadenopathy 1.2cm (Incidental).",
        "loop_status_text": "- CBC/CXR: Completed.\n- Colonoscopy: Referral sent but patient never scheduled (14 days pending).",
        "diagnosis": "Stage II colon adenocarcinoma",
        "primary_hypothesis": "Colon cancer",
        "failure_mode": "Colonoscopy never completed, X-ray lymphadenopathy overlooked"
    },
    {
        "pid": "P002", "age": 72, "sex": "M",
        "complaint": "Worsening cough and shortness of breath",
        "pmh": "COPD, CAD",
        "orders_text": "CXR, CBC, Azithromycin",
        "critical_phrase": "r/o pneumonia vs COPD exacerbation",
        "results_text": "- CXR: RLL infiltrate consistent with pneumonia.",
        "loop_status_text": "- CXR: Completed but result filed to Media tab (missed).\n- Patient treated for COPD only.",
        "diagnosis": "Bacterial Pneumonia",
        "primary_hypothesis": "Pneumonia",
        "failure_mode": "Positive pneumonia finding on X-ray not acknowledged by provider"
    },
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
    # FILLER CASES 
    { "pid": "P004", "age": 50, "sex": "F", "complaint": "SOB after flight", "pmh": "DVT hx", "orders_text": "CT Angio", "critical_phrase": "r/o PE", "results_text": "None", "loop_status_text": "Patient left without being seen", "diagnosis": "Pulmonary Embolism", "primary_hypothesis": "PE", "failure_mode": "Patient left before scan" },
    { "pid": "P005", "age": 80, "sex": "M", "complaint": "Confusion", "pmh": "Dementia", "orders_text": "UA, Lactate", "critical_phrase": "r/o sepsis", "results_text": "Lactate 3.0", "loop_status_text": "Lactate ignored", "diagnosis": "Sepsis", "primary_hypothesis": "Sepsis", "failure_mode": "High lactate not acted upon" },
    { "pid": "P006", "age": 60, "sex": "F", "complaint": "Screening", "pmh": "None", "orders_text": "Mammogram", "critical_phrase": "routine screening", "results_text": "BIRADS 4", "loop_status_text": "Report unread", "diagnosis": "Breast Cancer", "primary_hypothesis": "Breast Cancer", "failure_mode": "BIRADS 4 finding missed" },
    { "pid": "P007", "age": 55, "sex": "M", "complaint": "Chest pain", "pmh": "HTN", "orders_text": "Troponin", "critical_phrase": "r/o ACS", "results_text": "Trop 0.04 -> 0.09", "loop_status_text": "Delta missed", "diagnosis": "NSTEMI", "primary_hypothesis": "ACS", "failure_mode": "Rising troponin ignored" },
    { "pid": "P008", "age": 65, "sex": "M", "complaint": "Checkup", "pmh": "DM2", "orders_text": "Creatinine", "critical_phrase": "monitor kidney function", "results_text": "Cr 1.9 (was 1.2)", "loop_status_text": "No referral", "diagnosis": "CKD Stage 3", "primary_hypothesis": "CKD", "failure_mode": "Worsening renal function ignored" },
    { "pid": "P009", "age": 60, "sex": "M", "complaint": "Blurry vision", "pmh": "DM2", "orders_text": "Ophtho referral", "critical_phrase": "screen retinopathy", "results_text": "None", "loop_status_text": "Referral pending 1yr", "diagnosis": "Proliferative Retinopathy", "primary_hypothesis": "Retinopathy", "failure_mode": "Referral never scheduled" },
    { "pid": "P010", "age": 70, "sex": "F", "complaint": "UTI symptoms", "pmh": "Afib on Warfarin", "orders_text": "Bactrim", "critical_phrase": "r/o UTI", "results_text": "None", "loop_status_text": "No INR check", "diagnosis": "Bleeding Risk", "primary_hypothesis": "Drug Interaction", "failure_mode": "Did not check INR while on Bactrim" }
]

def generate_patient(scen):
    print(f"🤖 Generating {scen['pid']}: {scen['diagnosis']}...")
    
    prompt = PROMPT_TEMPLATE.format(
        age=scen['age'], sex=scen['sex'], complaint=scen['complaint'], pmh=scen['pmh'],
        orders_text=scen['orders_text'], critical_phrase=scen['critical_phrase'],
        results_text=scen['results_text'], loop_status_text=scen['loop_status_text'],
        diagnosis=scen['diagnosis'], failure_mode=scen['failure_mode'],
        pid=scen['pid'], primary_hypothesis=scen['primary_hypothesis']
    )
    
    try:
        # UPDATED: Using 'gemini-1.5-flash-002' which is the stable version
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        data = json.loads(response.text)
        
        filename = f"data/patients/patient_{scen['pid']}.json"
        with open(filename, "w") as f:
            json.dump(data, f, indent=2)
        print(f"✅ Saved {filename}")
        
    except Exception as e:
        print(f"❌ Failed {scen['pid']}: {e}")
        time.sleep(2)

# --- MAIN LOOP ---
print("🚀 Starting Batch Generation (Model Version Fixed)...")
for scenario in SCENARIOS:
    generate_patient(scenario)
    time.sleep(1.5)

print("\n🎉 Data Generation Complete! Check data/patients/ folder.")