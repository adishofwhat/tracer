import os
import certifi
from google import genai

# --- 1. WINDOWS SSL FIX ---
os.environ['SSL_CERT_FILE'] = certifi.where()

# --- 2. SETUP CLIENT ---
API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    print("❌ Error: GEMINI_API_KEY is not set.")
    exit(1)

client = genai.Client(api_key=API_KEY)

# --- 3. LIST MODELS ---
print("🔍 querying Google API for available models...")

try:
    # Iterate through the pager object
    count = 0
    for model in client.models.list():
        # Only show models that can generate text
        methods = model.supported_generation_methods or []
        if "generateContent" in methods:
            print(f"✅ AVAILABLE: {model.name}")
            count += 1
            
    if count == 0:
        print("⚠️ No generation models found. Check your API key permissions.")
        
except Exception as e:
    print(f"❌ FATAL ERROR: {e}")