import os
import certifi
from huggingface_hub import snapshot_download

# --- WINDOWS SSL FIX ---
os.environ['SSL_CERT_FILE'] = certifi.where()

# Target the 1.5 4B version you requested
MODEL_ID = "google/medgemma-1.5-4b-it"
LOCAL_DIR = "./models/medgemma-1.5-4b-it"

print(f"⬇️ Starting {MODEL_ID} download...")
print("⚠️ This model is ~9GB. Ensure you have enough disk space.")

try:
    model_path = snapshot_download(
        repo_id=MODEL_ID,
        local_dir=LOCAL_DIR,
        # Removed deprecated arguments to stop warnings
        token=True # This tells the script to use the token from 'huggingface-cli login'
    )
    print(f"✅ Download complete! Model saved to: {model_path}")

except Exception as e:
    print(f"❌ Download failed: {e}")
    print("\n💡 TIP: If you see a 401 error, make sure you ran 'huggingface-cli login' successfully.")