import os
import json
import certifi

# --- WINDOWS SSL FIX ---
os.environ['SSL_CERT_FILE'] = certifi.where()

from google import genai
from google.genai import types

# --- CONFIGURATION ---
API_KEY = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=API_KEY)
MODEL_ID = "gemini-2.5-flash"

BATCH_DESC = "10 Oncology cases (Colon, Breast, Lung - focus on early signs vs missed diagnosis)"

PROMPT_TEMPLATE = """
You are creating training data for fine-tuning MedGemma to extract diagnostic hypotheses.
Generate **10 realistic clinical examples** for this specific category:
CATEGORY: {batch_desc}

REQUIREMENTS:
1. **Input:** A realistic clinical note (Subjective, Objective, Assessment, Plan). Use abbreviations (Pt, yo, hx, c/o).
2. **Output:** A structured JSON object with hypothesis, differential, confidence, urgency, tests, and reasoning.
3. **Failure Mode:** Ensure 3 out of these 10 examples represent a POTENTIAL MISSED DIAGNOSIS.

OUTPUT FORMAT (JSON List):
[
  {{
    "input": "45yo M c/o chest pain...",
    "output": {{
      "primary_hypothesis": "...",
      "differential_diagnoses": ["..."],
      "confidence": "high/medium/low",
      "key_symptoms": ["..."],
      "urgency": "high/medium/low",
      "tests_ordered": ["..."],
      "reasoning": "..."
    }}
  }}
]
"""

print(f"🚀 Filling Missing Batch: {BATCH_DESC}...")

try:
    # 1. Generate the missing batch
    response = client.models.generate_content(
        model=MODEL_ID,
        contents=PROMPT_TEMPLATE.format(batch_desc=BATCH_DESC),
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        )
    )
    new_data = json.loads(response.text)
    
    if not isinstance(new_data, list):
        new_data = [new_data]
        
    print(f"   ✅ Generated {len(new_data)} oncology examples.")

    # 2. Load existing data
    path = "data/training/hypothesis_extraction_train.json"
    with open(path, "r") as f:
        existing_data = json.load(f)
        
    # 3. Append and Save
    # Handle the structure (it might be wrapped in {"examples": []} or just a list)
    if isinstance(existing_data, dict) and "examples" in existing_data:
        existing_data["examples"].extend(new_data)
        final_list = existing_data["examples"]
    elif isinstance(existing_data, list):
        existing_data.extend(new_data)
        final_list = existing_data
    else:
        # Fallback
        final_list = new_data

    # Save back structured correctly
    with open(path, "w") as f:
        json.dump({"examples": final_list}, f, indent=2)

    print(f"🎉 SUCCESS! Total examples: {len(final_list)}")

except Exception as e:
    print(f"❌ Failed: {e}")