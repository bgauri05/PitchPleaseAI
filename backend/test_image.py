import requests
import base64

# The API endpoint you just built
url = "http://localhost:8000/api/v1/content/generate-image"
cd backedcd 
# The security headers
headers = {
    "X-API-Key": "hackathon_super_secret_key",
    "Content-Type": "application/json"
}

# The prompt for FLUX.1
payload = {
    "prompt": "A highly detailed, cinematic photograph of a modern tech workspace in Bangalore at golden hour, featuring a glowing neon sign that says 'BrandSetu'. 8k, photorealistic."
}

print("🚀 Sending request to the Image Engine...")
print("⏳ (This might take 10-20 seconds if the Hugging Face model is waking up from sleep mode)")

response = requests.post(url, headers=headers, json=payload)

if response.status_code == 200:
    # Extract the base64 string from your FastAPI response
    base64_str = response.json()["image_base64"]
    
    # Decode the string back into binary image data and save it
    with open("test_image.png", "wb") as f:
        f.write(base64.b64decode(base64_str))
    print("✅ SUCCESS! Open 'test_image.png' in your file explorer to see the result!")
else:
    print(f"❌ Failed with status code: {response.status_code}")
    print(response.text)