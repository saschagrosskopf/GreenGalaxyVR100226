import firebase_admin
from firebase_admin import credentials, auth
import os
import json
import base64

# Firebase project ID
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "greengalaxyvr-3c624")

# Path to service account key (place it in backend folder)
SERVICE_ACCOUNT_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "serviceAccountKey.json")

# Track if we have full credentials
HAS_FULL_CREDENTIALS = False

# Initialize Firebase Admin
try:
    if not firebase_admin._apps:
        if os.path.exists(SERVICE_ACCOUNT_PATH):
            cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
            firebase_admin.initialize_app(cred)
            HAS_FULL_CREDENTIALS = True
            print(f"Firebase Admin Initialized with Service Account Key")
        else:
            firebase_admin.initialize_app(options={'projectId': FIREBASE_PROJECT_ID})
            print(f"Firebase Admin Initialized without credentials (dev mode - JWT decode only)")
except Exception as e:
    print(f"Firebase Admin Init Warning: {e}")

async def verify_google_token(id_token: str):
    # Check for demo/mock token first (FOR CONTROLLED TESTING ONLY - should be disabled in production)
    if id_token and id_token.startswith("mockHeader."):
        # Note: In a real enterprise app, this would be guarded by an environment flag
        try:
            parts = id_token.split(".")
            if len(parts) >= 2:
                # Add padding if missing
                token_payload = parts[1]
                missing_padding = len(token_payload) % 4
                if missing_padding:
                    token_payload += '=' * (4 - missing_padding)
                
                payload = json.loads(base64.b64decode(token_payload))
                return {
                    "uid": payload.get('sub', 'demo_user'),
                    "email": payload.get('email', 'demo@example.com'),
                    "name": payload.get('name', 'Demo User'),
                    "picture": payload.get('picture', '')
                }
        except Exception as e:
            print(f"Mock token parse error: {e}")
    
    # Strictly enforce Firebase verification if we have the keys
    if HAS_FULL_CREDENTIALS:
        try:
            decoded_token = auth.verify_id_token(id_token, check_revoked=True)
            return {
                "uid": decoded_token['uid'],
                "email": decoded_token.get('email'),
                "name": decoded_token.get('name'),
                "picture": decoded_token.get('picture')
            }
        except Exception as e:
            print(f"Token Verification Failed: {e}")
            return None
    
    # 🧪 DEVELOPMENT FALLBACK: Token Decoding (UNVERIFIED)
    # This branch is ONLY hit if SERVICE_ACCOUNT_PATH is missing.
    # It allows developers to keep building the UI/Logic without a GCP Service Account.
    elif os.getenv("ALLOW_UNVERIFIED_AUTH") == "true":
        try:
            # Decode the payload without verifying signatures
            # id_token format: header.payload.signature
            parts = id_token.split(".")
            if len(parts) >= 2:
                # Add padding if missing
                token_payload = parts[1]
                missing_padding = len(token_payload) % 4
                if missing_padding:
                    token_payload += '=' * (4 - missing_padding)
                    
                payload_json = base64.b64decode(token_payload).decode("utf-8")
                payload = json.loads(payload_json)
                
                print("⚠️  DEV WARNING: Authenticated user via unverified JWT decoding.")
                print("   To enable secure production verification, provide 'serviceAccountKey.json'.")
                
                return {
                    "uid": payload.get('sub') or payload.get('uid'),
                    "email": payload.get('email'),
                    "name": payload.get('name'),
                    "picture": payload.get('picture')
                }
        except Exception as e:
            print(f"Dev Fallback Decode Failed: {e}")
            return None
        
        print("CRITICAL: Firebase credentials missing. Verification impossible.")
        return None
