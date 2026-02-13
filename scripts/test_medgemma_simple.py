import os
import torch
import certifi
from transformers import AutoProcessor, AutoModelForImageTextToText

# --- WINDOWS SSL FIX ---
os.environ['SSL_CERT_FILE'] = certifi.where()

model_id = "./models/medgemma-1.5-4b-it"

print("🧠 Loading MedGemma 1.5 in CPU MODE (Slow but Stable)...")
print("⚠️ This will use your System RAM. Please close Chrome tabs.")

try:
    # Load directly to CPU
    model = AutoModelForImageTextToText.from_pretrained(
        model_id,
        device_map="cpu",  # <--- The reliability fix
        torch_dtype=torch.float32, 
        trust_remote_code=True,
        low_cpu_mem_usage=True
    )
    
    processor = AutoProcessor.from_pretrained(model_id)
    print("✅ Model loaded on CPU! It is ready.")

    # Test Prompt
    messages = [
        {
            "role": "user",
            "content": [{"type": "text", "text": "Extract the hypothesis: 58yo F, 12lb weight loss, fatigue. Assessment: r/o colon cancer."}]
        }
    ]

    inputs = processor.apply_chat_template(
        messages, add_generation_prompt=True, tokenize=True,
        return_dict=True, return_tensors="pt"
    ).to(model.device) # Moves inputs to CPU

    print("\n🩺 Generating response (this may take 30-60 seconds)...")
    
    with torch.inference_mode():
        outputs = model.generate(
            **inputs, 
            max_new_tokens=30,
            do_sample=False
        )
        response = processor.decode(outputs[0][inputs["input_ids"].shape[-1]:], skip_special_tokens=True)

    print(f"\nAI Response: {response}")
    print("\n🎉 DAY 1 COMPLETE! The model is alive.")

except Exception as e:
    print(f"❌ Failed: {e}")