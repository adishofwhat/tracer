import os
import json
import time
import certifi  # <--- CRITICAL FIX

# --- WINDOWS SSL PERMISSION BYPASS ---
os.environ['SSL_CERT_FILE'] = certifi.where()

from google import genai
from google.genai import types

# --- CONFIGURATION ---
API_KEY = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=API_KEY)
MODEL_ID = "gemini-3-flash-preview"  # Using the stable model alias that worked for you before

# Ensure directory exists
os.makedirs("data/training", exist_ok=True)

# --- BATCH DEFINITIONS (To ensure diversity) ---
BATCHES = [
    "10 Cardiology cases (5 urgent like MI/STEMI, 5 chronic like CHF)",
    "10 Oncology cases (Colon, Breast, Lung - focus on early signs vs missed diagnosis)",
    "10 Neurology cases (Stroke, TIA, Multiple Sclerosis - subtle symptoms)",
    "10 Gastroenterology cases (IBD, Liver Disease, obscure GI bleeds)",
    "10 Pulmonary cases (PE, COPD, Pneumonia - include 'r/o PE' examples)",
    "10 Endocrinology cases (Thyroid, Diabetes complications, Adrenal)",
    "10 Infectious Disease cases (Sepsis, obscure fungal/viral, delayed recognition)",
    "10 Primary Care 'Vague' cases (Fatigue, Weight loss - difficult diagnosis)",
    "10 Emergency Medicine 'Missed' cases (Patient discharged who shouldn't have been)",
    "10 Pediatric/Geriatric mixed cases (Subtle presentation in vulnerable groups)"
]

PROMPT_TEMPLATE = """
You are creating training data for fine-tuning MedGemma to extract diagnostic hypotheses.
Generate **10 realistic clinical examples** for this specific category:
CATEGORY: {batch_desc}

REQUIREMENTS:
1. **Input:** A realistic clinical note (Subjective, Objective, Assessment, Plan). Use abbreviations (Pt, yo, hx, c/o).
2. **Output:** A structured JSON object with hypothesis, differential, confidence, urgency, tests, and reasoning.
3. **Failure Mode:** Ensure 3 out of these 10 examples represent a POTENTIAL MISSED DIAGNOSIS (e.g., vague symptoms ignored, test not ordered).

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

def generate_batch(batch_index, batch_desc):
    print(f"🤖 Batch {batch_index+1}/10: Generating {batch_desc}...")
    
    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=PROMPT_TEMPLATE.format(batch_desc=batch_desc),
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        # Parse the batch
        batch_data = json.loads(response.text)
        
        # Validation: Ensure it's a list
        if isinstance(batch_data, list):
            print(f"   ✅ Received {len(batch_data)} examples.")
            return batch_data
        else:
            print("   ⚠️ Warning: API returned a single object, wrapping in list.")
            return [batch_data]

    except Exception as e:
        print(f"   ❌ Batch failed: {e}")
        return []

# --- MAIN EXECUTION ---
print(f"🚀 Starting Generation of 100 Training Examples using {MODEL_ID}...")
all_examples = []

for i, batch_desc in enumerate(BATCHES):
    batch_result = generate_batch(i, batch_desc)
    all_examples.extend(batch_result)
    
    # Save intermediate progress (in case of crash)
    with open("data/training/hypothesis_extraction_train_PARTIAL.json", "w") as f:
        json.dump({"examples": all_examples}, f, indent=2)
        
    # Rate limit pause
    time.sleep(2)

# Final Save
final_path = "data/training/hypothesis_extraction_train.json"
with open(final_path, "w") as f:
    json.dump({"examples": all_examples}, f, indent=2)

print(f"\n🎉 DONE! Generated {len(all_examples)} examples.")
print(f"Saved to: {final_path}")