import os
import torch
import certifi
from transformers import AutoProcessor, AutoModelForImageTextToText, BitsAndBytesConfig

# --- WINDOWS SSL FIX ---
os.environ['SSL_CERT_FILE'] = certifi.where()

model_id = "./models/medgemma-1.5-4b-it"

print("🧠 Loading MedGemma 1.5 (4B Multimodal)...")

# 4-bit config to fit in your 4GB GTX 1050
quant_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True,
    llm_int8_enable_fp32_cpu_offload=True
)

try:
    model = AutoModelForImageTextToText.from_pretrained(
        model_id,
        quantization_config=quant_config,
        device_map="balanced", # <--- Better than "auto" for low VRAM
        trust_remote_code=True
    )
    processor = AutoProcessor.from_pretrained(model_id)
    print("✅ Model loaded successfully!")

    # Your original test note
    test_note = """
    SUBJECTIVE: 58-year-old woman with 3-month history of fatigue and 12-pound weight loss. Reports decreased appetite. No fever, no night sweats.

    OBJECTIVE: 
    Vitals: BP 135/82, HR 88, Temp 98.6°F
    Exam: Pale conjunctiva. Abdomen soft, non-tender.

    ASSESSMENT: Concerning for occult malignancy given weight loss and age. Rule out colon cancer vs other GI malignancy.

    PLAN: CBC, CMP, chest X-ray, colonoscopy referral.
    """


    # MedGemma 1.5 uses a specific message format
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": f"Extract the diagnostic hypothesis from this clinical note:{test_note} Primary diagnosis being ruled out:"}
            ]
        }
    ]

    # New way to prepare inputs for multimodal models
    inputs = processor.apply_chat_template(
        messages, add_generation_prompt=True, tokenize=True,
        return_dict=True, return_tensors="pt"
    ).to(model.device)

    print("\nTesting inference...")
    with torch.inference_mode():
        outputs = model.generate(**inputs, max_new_tokens=50)
        # Decode only the response part
        response = processor.decode(outputs[0][inputs["input_ids"].shape[-1]:], skip_special_tokens=True)

    print("\nMedGemma response:")
    print(response)
    print("\n✅ Test complete!")

except Exception as e:
    print(f"❌ Failed: {e}")