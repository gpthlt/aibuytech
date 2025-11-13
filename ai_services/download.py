import os
import gdown

# Google Drive folder URL or ID
google_drive_folder_url = "https://drive.google.com/drive/u/0/folders/1QvS1zRWWZdFCGUxXhBJeBbIovAIxfUn1"
model_name = "dinov3-vitl16-pretrain-lvd1689m"
local_dir = f"./model/"

# Create models directory if it doesn't exist
os.makedirs(local_dir, exist_ok=True)

print(f"Downloading model from Google Drive to '{local_dir}'...")

# Download the entire folder from Google Drive using URL format
# This is more reliable than using just the ID
try:
    gdown.download_folder(
        url=google_drive_folder_url,
        output=local_dir,
        quiet=False,
        use_cookies=True  # Use cookies for better compatibility
    )
    print(f"Model downloaded successfully to '{local_dir}'")
except Exception as e:
    print(f"Error downloading with URL method: {e}")
    print("Trying alternative method with folder ID...")
    # Fallback: try with folder ID
    gdown.download_folder(
        id="1QvS1zRWWZdFCGUxXhBJeBbIovAIxfUn1",
        output=local_dir,
        quiet=False,
        use_cookies=True
    )
    print(f"Model downloaded successfully to '{local_dir}'")